const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const logger = require("../utils/logger");
const notificationConfig = require("../utils/notificationConfig");

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.justConnected = false; // Flag untuk notifikasi
  }

  async initialize(forceRestart = false) {
    // If force restart, destroy existing client first
    if (forceRestart && this.client) {
      console.log("🔄 Force restarting WhatsApp client...");
      try {
        await this.client.destroy();
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
      } catch (err) {
        console.error("Error destroying client:", err.message);
      }
    }

    if (this.client) {
      console.log("WhatsApp client already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing WhatsApp client...");
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: "./whatsapp-session",
        }),
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
          ],
        },
      });

      // QR Code untuk scan pertama kali
      this.client.on("qr", (qr) => {
        console.log("\n📱 Scan QR Code ini dengan WhatsApp:");
        console.log("QR Code length:", qr.length);
        qrcode.generate(qr, { small: true });
        this.qrCode = qr;
        logger.info("WhatsApp QR Code generated", { qrLength: qr.length });

        // QR code expires in 60 seconds, reset after that
        setTimeout(() => {
          if (this.qrCode === qr && !this.isReady) {
            console.log("⚠️  QR Code expired, waiting for new one...");
            this.qrCode = null;
          }
        }, 60000);
      });

      // WhatsApp ready
      this.client.on("ready", () => {
        console.log("✅ WhatsApp Client is ready!");
        this.isReady = true;
        this.qrCode = null;
        this.justConnected = true; // Set flag untuk notifikasi
        logger.info("WhatsApp client connected successfully");

        // Reset flag setelah 10 detik
        setTimeout(() => {
          this.justConnected = false;
        }, 10000);
      });

      // Authenticated
      this.client.on("authenticated", () => {
        console.log("✅ WhatsApp authenticated");
        logger.info("WhatsApp authenticated");
      });

      // Auth failure
      this.client.on("auth_failure", (msg) => {
        console.error("❌ WhatsApp authentication failed:", msg);
        logger.error("WhatsApp authentication failed", { error: msg });
      });

      // Disconnected
      this.client.on("disconnected", (reason) => {
        console.log("⚠️  WhatsApp disconnected:", reason);
        this.isReady = false;
        logger.warn("WhatsApp disconnected", { reason });
      });

      // Initialize client
      this.client.initialize().catch((err) => {
        console.error("❌ Failed to initialize WhatsApp client:", err.message);
        logger.error("Failed to initialize WhatsApp client", {
          error: err.message,
        });
        this.client = null;
        this.isReady = false;
      });
    } catch (err) {
      console.error("❌ Failed to create WhatsApp client:", err.message);
      logger.error("Failed to create WhatsApp client", { error: err.message });
      this.client = null;
      this.isReady = false;
    }
  }

  async sendMessage(phoneNumber, message) {
    try {
      if (!this.isReady) {
        throw new Error(
          "WhatsApp client is not ready. Please scan QR code first."
        );
      }

      // Format nomor: hapus karakter non-numeric, tambahkan 62 untuk Indonesia
      let formattedNumber = phoneNumber.replace(/\D/g, "");

      // Jika diawali 0, ganti dengan 62
      if (formattedNumber.startsWith("0")) {
        formattedNumber = "62" + formattedNumber.substring(1);
      }

      // Jika belum ada country code, tambahkan 62
      if (!formattedNumber.startsWith("62")) {
        formattedNumber = "62" + formattedNumber;
      }

      const chatId = `${formattedNumber}@c.us`;

      await this.client.sendMessage(chatId, message);

      logger.info("WhatsApp message sent", { to: phoneNumber, chatId });
      return { success: true, message: "Message sent successfully" };
    } catch (error) {
      logger.error("Failed to send WhatsApp message", {
        error: error.message,
        phoneNumber,
      });
      throw error;
    }
  }

  async sendOrderConfirmation(order) {
    const config = await notificationConfig.getAll();

    // Format items list
    let itemsList = "";
    if (order.items && order.items.length > 0) {
      itemsList = order.items
        .map((item) => {
          const itemTotal = item.quantity * item.price;
          return `• ${item.product_name}\n  ${
            item.quantity
          } x Rp ${this.formatPrice(item.price)} = Rp ${this.formatPrice(
            itemTotal
          )}`;
        })
        .join("\n");
    }

    const orderUrl = `${config.frontend_url}/order-status?order=${order.id}`;
    const paymentUrl = `${config.frontend_url}/payment?order=${order.id}`;

    const message = `🛍️ *Pesanan Baru Diterima!*

Halo *${order.customer_name}*,

Terima kasih atas pesanan Anda!

📦 *Detail Pesanan:*
Order ID: #${order.id}
Status: ${this.getStatusText(order.status)}

🛒 *Items:*
${itemsList}

💰 *Total Pembayaran:*
Rp ${this.formatPrice(order.total)}

📍 *Alamat Pengiriman:*
${order.shipping_address}

Silakan lakukan pembayaran untuk memproses pesanan Anda.
🔗 *Link pembayaran:*
${paymentUrl}

Kami akan segera memproses pesanan Anda.

🔗 *Lacak Pesanan:*
${orderUrl}

Jika ada pertanyaan, silakan hubungi kami.

Terima kasih! 🙏`;

    return await this.sendMessage(order.customer_phone, message);
  }

  async sendOrderStatusUpdate(order, oldStatus) {
    const config = await notificationConfig.getAll();

    const statusEmoji = {
      pending: "⏳",
      processing: "📦",
      shipped: "🚚",
      delivered: "✅",
      cancelled: "❌",
    };

    // Format items list
    let itemsList = "";
    if (order.items && order.items.length > 0) {
      itemsList = order.items
        .map((item) => {
          const itemTotal = item.quantity * item.price;
          return `• ${item.product_name}\n  ${
            item.quantity
          } x Rp ${this.formatPrice(item.price)} = Rp ${this.formatPrice(
            itemTotal
          )}`;
        })
        .join("\n");
    }

    const orderUrl = `${config.frontend_url}/order-status?order=${order.id}`;

    const message = `${statusEmoji[order.status]} *Update Status Pesanan*

Halo *${order.customer_name}*,

Status pesanan Anda telah diperbarui:

📦 *Detail Pesanan:*
Order ID: #${order.id}
Status Lama: ${this.getStatusText(oldStatus)}
Status Baru: ${this.getStatusText(order.status)}

🛒 *Items:*
${itemsList}

💰 *Total Pembayaran:*
Rp ${this.formatPrice(order.total)}

${this.getStatusMessage(order.status)}

🔗 *Lihat Detail Pesanan:*
${orderUrl}

Terima kasih! 🙏`;

    return await this.sendMessage(order.customer_phone, message);
  }

  getStatusText(status) {
    const statusMap = {
      pending: "Menunggu Pembayaran",
      processing: "Sedang Diproses",
      shipped: "Dalam Pengiriman",
      delivered: "Pesanan Diterima",
      cancelled: "Dibatalkan",
    };
    return statusMap[status] || status;
  }

  getStatusMessage(status) {
    const messages = {
      pending:
        "⚠️ Silakan lakukan pembayaran untuk melanjutkan pesanan Anda.\n\n📌 Pesanan akan otomatis dibatalkan jika tidak ada pembayaran dalam 24 jam.",
      processing:
        "✨ Tim kami sedang memproses dan mengemas pesanan Anda dengan hati-hati.\n\n⏱️ Estimasi pengiriman: 1-2 hari kerja",
      shipped:
        "🚚 Pesanan Anda sedang dalam perjalanan ke alamat tujuan.\n\n⏱️ Estimasi tiba: 2-3 hari kerja\n📦 Mohon pastikan ada orang di alamat untuk menerima paket",
      delivered:
        "🎉 Pesanan Anda telah diterima. Terima kasih atas kepercayaan Anda!\n\n💬 Kami harap Anda puas dengan produk yang diterima.\n⭐ Jangan lupa berikan review untuk produk kami!",
      cancelled:
        "😔 Pesanan Anda telah dibatalkan.\n\n💰 Pengembalian dana akan diproses dalam 3-7 hari kerja (jika sudah melakukan pembayaran)\n\n❓ Jika ada pertanyaan, silakan hubungi kami.",
    };
    return messages[status] || "";
  }

  formatPrice(price) {
    return new Intl.NumberFormat("id-ID").format(price);
  }

  getStatus() {
    return {
      isReady: this.isReady,
      hasQR: !!this.qrCode,
      qrCode: this.qrCode,
      justConnected: this.justConnected,
    };
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      this.qrCode = null;
      logger.info("WhatsApp client disconnected");
    }
  }

  // Notifikasi ke admin saat customer upload bukti transfer
  async sendPaymentUploadedNotification(order, payment, adminPhone) {
    if (!adminPhone) {
      console.log("Admin phone not configured, skipping WhatsApp notification");
      return false;
    }

    const message = `🔔 *Bukti Transfer Baru!*

Ada customer yang baru saja mengupload bukti transfer.

👤 *Detail Customer:*
Nama: ${order.customer_name}
Email: ${order.customer_email}
Phone: ${order.customer_phone}

📦 *Detail Pesanan:*
Order ID: #${order.id}
Total Pesanan: Rp ${this.formatPrice(order.total)}

💳 *Detail Pembayaran:*
Metode: ${
      payment.payment_method === "transfer_bank"
        ? "Transfer Bank"
        : payment.payment_method === "ewallet"
        ? "E-Wallet"
        : "Cash on Delivery"
    }
${payment.bank_name ? `Bank: ${payment.bank_name}` : ""}
${payment.account_holder ? `Atas Nama: ${payment.account_holder}` : ""}
Jumlah Dibayar: Rp ${this.formatPrice(payment.amount)}
${payment.notes ? `Catatan: ${payment.notes}` : ""}

⏰ *Waktu Upload:*
${new Date(payment.created_at).toLocaleString("id-ID")}

⚡ *Action Required:*
Silakan verifikasi pembayaran melalui admin panel.

Link: ${
      process.env.ADMIN_URL || "http://localhost:3000/admin"
    }/payments/pending`;

    return await this.sendMessage(adminPhone, message);
  }

  // Notifikasi ke customer saat berhasil upload bukti transfer
  async sendPaymentUploadConfirmation(order, payment) {
    const config = await notificationConfig.getAll();
    const orderUrl = `${config.frontend_url}/order-status?order=${order.id}`;

    const message = `✅ *Bukti Transfer Diterima!*

Halo *${order.customer_name}*,

Terima kasih! Kami telah menerima bukti transfer Anda. 🙏

📦 *Detail Pesanan:*
Order ID: #${order.id}
Total Pesanan: Rp ${this.formatPrice(order.total)}

💳 *Detail Pembayaran:*
Metode: ${
      payment.payment_method === "transfer_bank"
        ? "Transfer Bank"
        : payment.payment_method === "ewallet"
        ? "E-Wallet"
        : "Cash on Delivery"
    }
${payment.bank_name ? `Bank: ${payment.bank_name}` : ""}
Jumlah Dibayar: Rp ${this.formatPrice(payment.amount)}
Status: ⏳ Menunggu Verifikasi

⏰ *Waktu Upload:*
${new Date(payment.created_at).toLocaleString("id-ID")}

📋 *Langkah Selanjutnya:*
Bukti transfer Anda sedang dalam proses verifikasi oleh tim kami. Anda akan menerima notifikasi setelah pembayaran diverifikasi.

⏱️ Estimasi verifikasi: 1-2 jam kerja

🔗 *Cek Status Pesanan:*
${orderUrl}

Terima kasih atas kesabaran Anda! 🙏`;

    return await this.sendMessage(order.customer_phone, message);
  }

  // Notifikasi saat pembayaran diverifikasi
  async sendPaymentVerifiedNotification(order, payment) {
    const config = await notificationConfig.getAll();
    const orderUrl = `${config.frontend_url}/order-status?order=${order.id}`;

    const message = `✅ *Pembayaran Terverifikasi!*

Halo *${order.customer_name}*,

Kabar baik! Pembayaran Anda telah berhasil diverifikasi. 🎉

💳 *Detail Pembayaran:*
Jumlah Dibayar: Rp ${this.formatPrice(payment.amount)}
Tanggal Verifikasi: ${new Date(payment.verified_at).toLocaleDateString("id-ID")}

📦 *Detail Pesanan:*
Order ID: #${order.id}
Status: Sedang Diproses
Total: Rp ${this.formatPrice(order.total)}

📍 *Alamat Pengiriman:*
${order.shipping_address}

✨ *Langkah Selanjutnya:*
Pesanan Anda sedang dikemas dan akan segera dikirim. Anda akan menerima notifikasi ketika pesanan sudah dikirim.

🔗 *Lacak Pesanan:*
${orderUrl}

Terima kasih atas pembayarannya! 🙏`;

    return await this.sendMessage(order.customer_phone, message);
  }

  // Notifikasi saat pembayaran ditolak
  async sendPaymentRejectedNotification(order, payment) {
    const config = await notificationConfig.getAll();
    const orderUrl = `${config.frontend_url}/order-status?order=${order.id}`;

    const message = `⚠️ *Pembayaran Ditolak*

Halo *${order.customer_name}*,

Mohon maaf, pembayaran Anda untuk Order #${order.id} tidak dapat diverifikasi.

❌ *Alasan Penolakan:*
${payment.rejection_reason}

📦 *Detail Pesanan:*
Order ID: #${order.id}
Total: Rp ${this.formatPrice(order.total)}

📋 *Apa yang harus dilakukan?*
Silakan upload ulang bukti transfer yang valid. Pastikan:
• Jumlah transfer sesuai dengan total pesanan
• Bukti transfer jelas dan dapat dibaca
• Format gambar (JPG/PNG)

🔗 *Upload Bukti Transfer Ulang:*
${orderUrl}

Jika Anda memiliki pertanyaan, silakan hubungi customer service kami.

Terima kasih! 🙏`;

    return await this.sendMessage(order.customer_phone, message);
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
