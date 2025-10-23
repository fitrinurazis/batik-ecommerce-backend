const nodemailer = require("nodemailer");
const notificationConfig = require("./notificationConfig");

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async getTransporter() {
    // Get latest settings from database with fallback to env
    const config = await notificationConfig.getAll();

    if (!config.smtp_user || !config.smtp_pass) {
      console.log("Email not configured (missing credentials)");
      return null;
    }

    // Create transporter with latest settings
    return nodemailer.createTransport({
      host: config.smtp_host || "smtp.gmail.com",
      port: parseInt(config.smtp_port) || 587,
      secure: config.smtp_secure === true || config.smtp_secure === "true",
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });
  }

  async sendOrderConfirmation(orderData, customerEmail) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      console.log("Email not configured, skipping order confirmation");
      return false;
    }

    const config = await notificationConfig.getAll();
    const emailTemplate = this.getOrderConfirmationTemplate(
      orderData,
      config.frontend_url,
      config.shop_name
    );

    try {
      await transporter.sendMail({
        from: `"${config.shop_name || "Batik Store"}" <${
          config.smtp_user
        }>`,
        to: customerEmail,
        subject: `Konfirmasi Pesanan #${orderData.id}`,
        html: emailTemplate,
      });

      console.log(`Email konfirmasi pesanan dikirim ke ${customerEmail}`);
      return true;
    } catch (error) {
      console.error("Gagal mengirim email:", error.message);
      return false;
    }
  }

  async sendOrderStatusUpdate(orderData, customerEmail, newStatus) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      console.log("Email not configured, skipping status update");
      return false;
    }

    const config = await notificationConfig.getAll();
    const emailTemplate = this.getStatusUpdateTemplate(
      orderData,
      newStatus,
      config.frontend_url,
      config.shop_name
    );

    try {
      await transporter.sendMail({
        from: `"${config.shop_name || "Batik Store"}" <${
          config.smtp_user
        }>`,
        to: customerEmail,
        subject: `Update Status Pesanan #${orderData.id}`,
        html: emailTemplate,
      });

      console.log(`Email update status dikirim ke ${customerEmail}`);
      return true;
    } catch (error) {
      console.error("Gagal mengirim email update status:", error.message);
      return false;
    }
  }

  async sendAdminNotification(orderData) {
    const transporter = await this.getTransporter();
    const config = await notificationConfig.getAll();

    if (!transporter || !config.admin_email) {
      console.log("Email not configured, skipping admin notification");
      return false;
    }

    const emailTemplate = this.getAdminNotificationTemplate(orderData, config.shop_name);

    try {
      await transporter.sendMail({
        from: `"${config.shop_name || "Batik Store"}" <${
          config.smtp_user
        }>`,
        to: config.admin_email,
        subject: `Pesanan Baru #${orderData.id}`,
        html: emailTemplate,
      });

      console.log("Email notifikasi admin dikirim");
      return true;
    } catch (error) {
      console.error("Gagal mengirim email notifikasi admin:", error.message);
      return false;
    }
  }

  getOrderConfirmationTemplate(
    orderData,
    frontendUrl = "https://ecommerce.fitrinurazis.com",
    shopName = "Batik Store"
  ) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    };

    const itemsHtml =
      orderData.items
        ?.map(
          (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.product_name || "Produk"
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
          item.price
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
          item.subtotal
        )}</td>
      </tr>
    `
        )
        .join("") || "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Konfirmasi Pesanan</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Terima Kasih atas Pesanan Anda!</h1>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #333;">Detail Pesanan #${orderData.id}</h2>

            <div style="margin: 20px 0;">
              <h3>Informasi Pelanggan:</h3>
              <p><strong>Nama:</strong> ${orderData.customer_name}</p>
              <p><strong>Email:</strong> ${orderData.customer_email}</p>
              <p><strong>Telepon:</strong> ${orderData.customer_phone}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3>Alamat Pengiriman:</h3>
              <p>${orderData.shipping_address}</p>
              <p>${orderData.shipping_city}, ${orderData.shipping_postal}</p>
              ${
                orderData.shipping_notes
                  ? `<div style="margin-top: 10px; padding: 10px; background: #e8f4f8; border-left: 3px solid #3498db; border-radius: 3px;">
                      <p style="margin: 0;"><strong>📝 Catatan Pengiriman:</strong></p>
                      <p style="margin: 5px 0 0 0;">${orderData.shipping_notes}</p>
                    </div>`
                  : ""
              }
            </div>

            <div style="margin: 20px 0;">
              <h3>Item Pesanan:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="padding: 10px; text-align: left;">Produk</th>
                    <th style="padding: 10px; text-align: center;">Qty</th>
                    <th style="padding: 10px; text-align: right;">Harga</th>
                    <th style="padding: 10px; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <div style="margin: 20px 0; text-align: right;">
              <p><strong>Subtotal: ${formatCurrency(
                orderData.subtotal
              )}</strong></p>
              ${
                orderData.shipping_cost
                  ? `<p>Ongkir: ${formatCurrency(orderData.shipping_cost)}</p>`
                  : ""
              }
              <h3 style="color: #d4691a;">Total: ${formatCurrency(
                orderData.total
              )}</h3>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #e8f4f8; border-radius: 5px;">
              <p><strong>Status Pesanan:</strong> ${
                orderData.status || "Pending"
              }</p>
              <p>Kami akan segera memproses pesanan Anda. Anda akan menerima email update ketika status pesanan berubah.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/order-status?order=${orderData.id}"
                 style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📦 Lacak Pesanan Saya
              </a>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0; color: #666; font-size: 12px;">
            <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
            <p>&copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getStatusUpdateTemplate(
    orderData,
    newStatus,
    frontendUrl = "https://ecommerce.fitrinurazis.com",
    shopName = "Batik Store"
  ) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    };

    const statusMessages = {
      pending: "⏳ Pesanan Anda Sedang Menunggu Pembayaran",
      processing: "📦 Pesanan Anda Sedang Diproses",
      shipped: "🚚 Pesanan Anda Telah Dikirim",
      delivered: "✅ Pesanan Anda Telah Sampai",
      cancelled: "❌ Pesanan Anda Telah Dibatalkan",
    };

    const statusColors = {
      pending: "#f39c12",
      processing: "#3498db",
      shipped: "#9b59b6",
      delivered: "#27ae60",
      cancelled: "#e74c3c",
    };

    const statusDescriptions = {
      pending:
        "Pesanan Anda telah kami terima dan sedang menunggu konfirmasi pembayaran. Silakan lakukan pembayaran untuk melanjutkan pesanan Anda.",
      processing:
        "Pembayaran Anda telah dikonfirmasi! Tim kami sedang memproses dan mengemas pesanan Anda dengan hati-hati.",
      shipped:
        "Pesanan Anda telah dikemas dan dikirim melalui kurir. Mohon untuk menunggu kedatangan paket Anda.",
      delivered:
        "Pesanan Anda telah sampai di alamat tujuan. Terima kasih telah berbelanja di toko kami! Kami menantikan pesanan Anda berikutnya.",
      cancelled:
        "Pesanan Anda telah dibatalkan. Jika Anda memiliki pertanyaan atau ingin melakukan pemesanan ulang, silakan hubungi kami.",
    };

    const itemsHtml =
      orderData.items
        ?.map(
          (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.product_name || "Produk"
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
          item.price
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
          item.subtotal
        )}</td>
      </tr>
    `
        )
        .join("") || "";

    // Status-specific additional info
    let statusSpecificContent = "";

    if (newStatus === "pending") {
      statusSpecificContent = `
        <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #f39c12;">
          <h4 style="margin-top: 0; color: #856404;">⚠️ Menunggu Pembayaran</h4>
          <p style="margin: 5px 0;">Silakan lakukan pembayaran untuk melanjutkan pesanan Anda.</p>
          <p style="margin: 5px 0;"><strong>Total yang harus dibayar:</strong> ${formatCurrency(
            orderData.total
          )}</p>
        </div>
      `;
    } else if (newStatus === "processing") {
      statusSpecificContent = `
        <div style="margin: 20px 0; padding: 15px; background: #d1ecf1; border-radius: 5px; border-left: 4px solid #3498db;">
          <h4 style="margin-top: 0; color: #0c5460;">📦 Pesanan Sedang Dikemas</h4>
          <p style="margin: 5px 0;">Tim kami sedang memproses dan mengemas pesanan Anda dengan hati-hati.</p>
          <p style="margin: 5px 0;">Estimasi pengiriman: 1-2 hari kerja</p>
        </div>
      `;
    } else if (newStatus === "shipped") {
      statusSpecificContent = `
        <div style="margin: 20px 0; padding: 15px; background: #e8daef; border-radius: 5px; border-left: 4px solid #9b59b6;">
          <h4 style="margin-top: 0; color: #6c3483;">🚚 Pesanan Dalam Perjalanan</h4>
          <p style="margin: 5px 0;"><strong>Alamat Pengiriman:</strong></p>
          <p style="margin: 5px 0;">${orderData.shipping_address}</p>
          <p style="margin: 5px 0;">${orderData.shipping_city}, ${orderData.shipping_postal}</p>
          ${
            orderData.shipping_notes
              ? `<div style="margin-top: 10px; padding: 10px; background: #f0e6f7; border-radius: 3px;">
                  <p style="margin: 0; font-size: 13px;"><strong>📝 Catatan Pengiriman:</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 13px;">${orderData.shipping_notes}</p>
                </div>`
              : ""
          }
          <p style="margin: 10px 0 5px 0;"><strong>Estimasi Tiba:</strong> 2-3 hari kerja</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">Mohon pastikan ada orang di alamat untuk menerima paket</p>
        </div>
      `;
    } else if (newStatus === "delivered") {
      statusSpecificContent = `
        <div style="margin: 20px 0; padding: 15px; background: #d4edda; border-radius: 5px; border-left: 4px solid #27ae60;">
          <h4 style="margin-top: 0; color: #155724;">✅ Pesanan Telah Diterima</h4>
          <p style="margin: 5px 0;">Terima kasih telah berbelanja di toko kami!</p>
          <p style="margin: 5px 0;">Kami harap Anda puas dengan produk yang diterima.</p>
          <p style="margin: 10px 0 5px 0;"><strong>Butuh bantuan?</strong> Silakan hubungi customer service kami.</p>
        </div>
      `;
    } else if (newStatus === "cancelled") {
      statusSpecificContent = `
        <div style="margin: 20px 0; padding: 15px; background: #f8d7da; border-radius: 5px; border-left: 4px solid #e74c3c;">
          <h4 style="margin-top: 0; color: #721c24;">❌ Pesanan Dibatalkan</h4>
          <p style="margin: 5px 0;">Pesanan Anda telah dibatalkan.</p>
          <p style="margin: 5px 0;">Jika Anda memiliki pertanyaan atau ingin melakukan pemesanan ulang, silakan hubungi kami.</p>
          <p style="margin: 10px 0 5px 0;"><strong>Pengembalian Dana:</strong> Akan diproses dalam 3-7 hari kerja (jika sudah melakukan pembayaran)</p>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Update Status Pesanan</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: ${
            statusColors[newStatus] || "#333"
          }; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">${
              statusMessages[newStatus] || "Update Status Pesanan"
            }</h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px;">

            <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
              Halo <strong>${orderData.customer_name}</strong>,
            </p>

            <p style="font-size: 14px; color: #666; line-height: 1.8;">
              ${
                statusDescriptions[newStatus] ||
                "Status pesanan Anda telah diperbarui."
              }
            </p>

            ${statusSpecificContent}

            <!-- Order Details -->
            <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Detail Pesanan</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Order ID:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">#${
                    orderData.id
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Tanggal Pesanan:</td>
                  <td style="padding: 8px 0; text-align: right; color: #333;">${new Date(
                    orderData.created_at
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: ${
                      statusColors[newStatus]
                    }; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                      ${newStatus.toUpperCase()}
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Items -->
            ${
              itemsHtml
                ? `
            <div style="margin: 30px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Item Pesanan</h3>
              <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="padding: 12px 10px; text-align: left; font-size: 13px; color: #666;">Produk</th>
                    <th style="padding: 12px 10px; text-align: center; font-size: 13px; color: #666;">Qty</th>
                    <th style="padding: 12px 10px; text-align: right; font-size: 13px; color: #666;">Harga</th>
                    <th style="padding: 12px 10px; text-align: right; font-size: 13px; color: #666;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 15px 10px 10px 10px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #333;">Total:</td>
                    <td style="padding: 15px 10px 10px 10px; text-align: right; font-weight: bold; font-size: 16px; color: ${
                      statusColors[newStatus]
                    }; border-top: 2px solid #333;">${formatCurrency(
                    orderData.total
                  )}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            `
                : ""
            }

            <!-- Track Order Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/order-status?order=${orderData.id}"
                 style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📦 Lihat Detail Pesanan
              </a>
            </div>

            <!-- Contact Info -->
            <div style="margin: 30px 0; padding: 20px; background: #f0f8ff; border-radius: 8px; border: 1px solid #b3d9ff;">
              <p style="margin: 0; font-size: 14px; color: #333;">
                <strong>📞 Butuh Bantuan?</strong><br>
                Jika Anda memiliki pertanyaan tentang pesanan ini, silakan hubungi customer service kami.
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 5px 0; color: #999; font-size: 12px;">
              Email ini dikirim otomatis, mohon tidak membalas email ini.
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">
              &copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;
  }

  getAdminNotificationTemplate(orderData, shopName = "Batik Store") {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pesanan Baru</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Pesanan Baru Masuk!</h1>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #333;">Pesanan #${orderData.id}</h2>

            <div style="margin: 20px 0;">
              <h3>Detail Pelanggan:</h3>
              <p><strong>Nama:</strong> ${orderData.customer_name}</p>
              <p><strong>Email:</strong> ${orderData.customer_email}</p>
              <p><strong>Telepon:</strong> ${orderData.customer_phone}</p>
              <p><strong>Alamat:</strong> ${orderData.shipping_address}, ${
      orderData.shipping_city
    } ${orderData.shipping_postal}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3>Detail Pesanan:</h3>
              <p><strong>Total Pesanan:</strong> ${formatCurrency(
                orderData.total
              )}</p>
              <p><strong>Waktu Pesanan:</strong> ${new Date(
                orderData.created_at
              ).toLocaleString("id-ID")}</p>
              <p><strong>Status:</strong> ${orderData.status || "Pending"}</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <p><strong>Tindakan Diperlukan:</strong></p>
              <p>Silakan login ke admin panel untuk memproses pesanan ini.</p>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0; color: #666; font-size: 12px;">
            <p>Email notifikasi admin</p>
            <p>&copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testEmailConnection() {
    const transporter = await this.getTransporter();
    if (!transporter) {
      return { success: false, message: "Email transporter not configured" };
    }

    try {
      await transporter.verify();
      return { success: true, message: "Email connection successful" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Notifikasi ke admin saat customer upload bukti transfer
  async sendPaymentUploadedNotification(orderData, paymentData) {
    const transporter = await this.getTransporter();
    const config = await notificationConfig.getAll();

    if (!transporter || !config.admin_email) {
      console.log(
        "Email not configured, skipping payment uploaded notification"
      );
      return false;
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    };

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bukti Transfer Diterima</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <h1 style="color: #333; text-align: center;">🔔 Bukti Transfer Baru!</h1>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #333;">Pesanan #${orderData.id}</h2>

            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <p><strong>⚠️ PERLU VERIFIKASI</strong></p>
              <p>Customer telah mengupload bukti transfer untuk pesanan ini.</p>
            </div>

            <div style="margin: 20px 0;">
              <h3>Detail Customer:</h3>
              <p><strong>Nama:</strong> ${orderData.customer_name}</p>
              <p><strong>Email:</strong> ${orderData.customer_email}</p>
              <p><strong>Telepon:</strong> ${orderData.customer_phone}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3>Detail Pembayaran:</h3>
              <p><strong>Metode:</strong> ${paymentData.payment_method}</p>
              <p><strong>Bank:</strong> ${paymentData.bank_name || "-"}</p>
              <p><strong>Nama Pengirim:</strong> ${
                paymentData.account_holder || "-"
              }</p>
              <p><strong>Jumlah:</strong> ${formatCurrency(
                paymentData.amount
              )}</p>
              <p><strong>Total Pesanan:</strong> ${formatCurrency(
                orderData.total
              )}</p>
              ${
                paymentData.notes
                  ? `<p><strong>Catatan:</strong> ${paymentData.notes}</p>`
                  : ""
              }
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #e8f4f8; border-radius: 5px;">
              <p><strong>📋 Tindakan Diperlukan:</strong></p>
              <p>Silakan login ke admin panel untuk verifikasi bukti transfer ini.</p>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0; color: #666; font-size: 12px;">
            <p>Email notifikasi admin</p>
            <p>&copy; ${new Date().getFullYear()} ${
      config.shop_name || "Batik Store"
    }. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"${config.shop_name || "Batik Store"}" <${
          config.smtp_user
        }>`,
        to: config.admin_email,
        subject: `🔔 Bukti Transfer Baru - Order #${orderData.id}`,
        html: emailTemplate,
      });

      console.log("Payment uploaded notification sent to admin");
      return true;
    } catch (error) {
      console.error(
        "Failed to send payment uploaded notification:",
        error.message
      );
      return false;
    }
  }

  // Notifikasi ke customer saat pembayaran diverifikasi
  async sendPaymentVerifiedNotification(orderData, paymentData) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      console.log(
        "Email not configured, skipping payment verified notification"
      );
      return false;
    }

    const config = await notificationConfig.getAll();
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    };

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pembayaran Diverifikasi</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <div style="background: #27ae60; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ Pembayaran Terverifikasi!</h1>
          </div>

          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
              Halo <strong>${orderData.customer_name}</strong>,
            </p>

            <p style="font-size: 14px; color: #666; line-height: 1.8;">
              Pembayaran Anda telah berhasil diverifikasi! Pesanan Anda akan segera kami proses dan kemas.
            </p>

            <div style="margin: 20px 0; padding: 20px; background: #d4edda; border-radius: 8px; border-left: 4px solid #27ae60;">
              <h4 style="margin-top: 0; color: #155724;">✅ Pembayaran Berhasil Diverifikasi</h4>
              <p style="margin: 5px 0;"><strong>Jumlah Dibayar:</strong> ${formatCurrency(
                paymentData.amount
              )}</p>
              <p style="margin: 5px 0;"><strong>Tanggal Verifikasi:</strong> ${new Date(
                paymentData.verified_at
              ).toLocaleDateString("id-ID")}</p>
              <p style="margin: 10px 0 5px 0;">Terima kasih atas pembayarannya! 🙏</p>
            </div>

            <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Detail Pesanan</h3>
              <p><strong>Order ID:</strong> #${orderData.id}</p>
              <p><strong>Status:</strong> <span style="background: #3498db; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">PROCESSING</span></p>
              <p><strong>Total:</strong> ${formatCurrency(orderData.total)}</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #d1ecf1; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px;"><strong>📦 Langkah Selanjutnya:</strong></p>
              <p style="margin: 5px 0; font-size: 14px;">Pesanan Anda sedang dikemas dan akan segera dikirim. Anda akan menerima email update ketika pesanan sudah dikirim.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.frontend_url}/order-status?order=${
      orderData.id
    }"
                 style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📦 Lacak Pesanan Saya
              </a>
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 5px 0; color: #999; font-size: 12px;">
              Email ini dikirim otomatis, mohon tidak membalas email ini.
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">
              &copy; ${new Date().getFullYear()} ${
      config.shop_name || "Batik Store"
    }. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"${config.shop_name || "Batik Store"}" <${
          config.smtp_user
        }>`,
        to: orderData.customer_email,
        subject: `✅ Pembayaran Terverifikasi - Order #${orderData.id}`,
        html: emailTemplate,
      });

      console.log(`Payment verified email sent to ${orderData.customer_email}`);
      return true;
    } catch (error) {
      console.error("Failed to send payment verified email:", error.message);
      return false;
    }
  }

  // Notifikasi ke customer saat berhasil upload bukti transfer
  async sendPaymentUploadConfirmation(orderData, paymentData) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      console.log("Email not configured, skipping payment upload confirmation");
      return false;
    }

    const config = await notificationConfig.getAll();
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    };

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bukti Transfer Diterima</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <div style="background: #3498db; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ Bukti Transfer Diterima!</h1>
          </div>

          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
              Halo <strong>${orderData.customer_name}</strong>,
            </p>

            <p style="font-size: 14px; color: #666; line-height: 1.8;">
              Terima kasih! Kami telah menerima bukti transfer Anda untuk pesanan #${
                orderData.id
              }.
            </p>

            <div style="margin: 20px 0; padding: 20px; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #3498db;">
              <h4 style="margin-top: 0; color: #0c5460;">📋 Status Pembayaran</h4>
              <p style="margin: 5px 0;">Bukti transfer Anda sedang dalam proses verifikasi oleh tim kami.</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background: #f39c12; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">PENDING VERIFIKASI</span></p>
              <p style="margin: 10px 0 5px 0; font-size: 13px; color: #666;">Estimasi verifikasi: 1-2 jam kerja</p>
            </div>

            <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Detail Pembayaran</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Order ID:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">#${
                    orderData.id
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Metode Pembayaran:</td>
                  <td style="padding: 8px 0; text-align: right; color: #333;">${
                    paymentData.payment_method
                  }</td>
                </tr>
                ${
                  paymentData.bank_name
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Bank:</td>
                  <td style="padding: 8px 0; text-align: right; color: #333;">${paymentData.bank_name}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 8px 0; color: #666;">Jumlah Transfer:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #27ae60;">${formatCurrency(
                    paymentData.amount
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Total Pesanan:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">${formatCurrency(
                    orderData.total
                  )}</td>
                </tr>
              </table>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px;"><strong>⏳ Langkah Selanjutnya:</strong></p>
              <p style="margin: 5px 0; font-size: 14px;">Tim kami akan memverifikasi pembayaran Anda. Anda akan menerima email konfirmasi setelah pembayaran diverifikasi.</p>
            </div>

            <div style="margin: 30px 0; padding: 20px; background: #f0f8ff; border-radius: 8px; border: 1px solid #b3d9ff;">
              <p style="margin: 0; font-size: 14px; color: #333;">
                <strong>📞 Butuh Bantuan?</strong><br>
                Jika Anda memiliki pertanyaan tentang pembayaran, silakan hubungi customer service kami.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.frontend_url}/order-status?order=${
      orderData.id
    }"
                 style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📦 Cek Status Pesanan
              </a>
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 5px 0; color: #999; font-size: 12px;">
              Email ini dikirim otomatis, mohon tidak membalas email ini.
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">
              &copy; ${new Date().getFullYear()} ${
      config.shop_name || "Batik Store"
    }. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"${config.shop_name || "Batik Store"}" <${
          config.smtp_user
        }>`,
        to: orderData.customer_email,
        subject: `✅ Bukti Transfer Diterima - Order #${orderData.id}`,
        html: emailTemplate,
      });

      console.log(
        `Payment upload confirmation sent to ${orderData.customer_email}`
      );
      return true;
    } catch (error) {
      console.error(
        "Failed to send payment upload confirmation:",
        error.message
      );
      return false;
    }
  }

  // Notifikasi ke customer saat pembayaran ditolak
  async sendPaymentRejectedNotification(orderData, paymentData) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      console.log(
        "Email not configured, skipping payment rejected notification"
      );
      return false;
    }

    const config = await notificationConfig.getAll();
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    };

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pembayaran Ditolak</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <div style="background: #e74c3c; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Pembayaran Ditolak</h1>
          </div>

          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
              Halo <strong>${orderData.customer_name}</strong>,
            </p>

            <p style="font-size: 14px; color: #666; line-height: 1.8;">
              Mohon maaf, pembayaran Anda untuk Order #${
                orderData.id
              } tidak dapat diverifikasi.
            </p>

            <div style="margin: 20px 0; padding: 20px; background: #f8d7da; border-radius: 8px; border-left: 4px solid #e74c3c;">
              <h4 style="margin-top: 0; color: #721c24;">❌ Alasan Penolakan:</h4>
              <p style="margin: 5px 0;">${paymentData.rejection_reason}</p>
            </div>

            <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Detail Pesanan</h3>
              <p><strong>Order ID:</strong> #${orderData.id}</p>
              <p><strong>Total:</strong> ${formatCurrency(orderData.total)}</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px;"><strong>📋 Apa yang harus dilakukan?</strong></p>
              <p style="margin: 5px 0; font-size: 14px;">Silakan upload ulang bukti transfer yang valid. Pastikan:</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Jumlah transfer sesuai dengan total pesanan</li>
                <li>Bukti transfer jelas dan dapat dibaca</li>
                <li>Format gambar (JPG/PNG)</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.frontend_url}/order-status?order=${
      orderData.id
    }"
                 style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📤 Upload Bukti Transfer Ulang
              </a>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">Jika Anda memiliki pertanyaan, silakan hubungi customer service kami.</p>
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 5px 0; color: #999; font-size: 12px;">
              Email ini dikirim otomatis, mohon tidak membalas email ini.
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">
              &copy; ${new Date().getFullYear()} ${
      config.shop_name || "Batik Store"
    }. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"${config.shop_name || "Batik Store"}" <${
          config.smtp_user
        }>`,
        to: orderData.customer_email,
        subject: `⚠️ Pembayaran Ditolak - Order #${orderData.id}`,
        html: emailTemplate,
      });

      console.log(`Payment rejected email sent to ${orderData.customer_email}`);
      return true;
    } catch (error) {
      console.error("Failed to send payment rejected email:", error.message);
      return false;
    }
  }

  async sendContactForm(contactData, adminEmail) {
    const transporter = await this.getTransporter();
    const config = await notificationConfig.getAll();

    if (!transporter) {
      console.log("Email not configured, skipping contact form");
      return false;
    }

    const emailTo = adminEmail || config.admin_email;

    if (!emailTo) {
      console.log("Admin email not configured");
      return false;
    }

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pesan Kontak Baru</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">

          <div style="background: #d97706; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📧 Pesan Kontak Baru</h1>
          </div>

          <div style="padding: 30px 20px;">
            <div style="margin: 20px 0; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #f39c12;">
              <h4 style="margin-top: 0; color: #856404;">📋 ${
                contactData.subject
              }</h4>
              <p style="margin: 5px 0;">Anda menerima pesan baru dari contact form website.</p>
            </div>

            <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Informasi Pengirim</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Nama:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">${
                    contactData.name
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    contactData.email
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Subjek:</td>
                  <td style="padding: 8px 0; color: #333;">${
                    contactData.subject
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Tanggal:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString(
                    "id-ID"
                  )}</td>
                </tr>
              </table>
            </div>

            <div style="margin: 30px 0; padding: 20px; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Pesan</h3>
              <div style="padding: 15px; background: #f9f9f9; border-radius: 5px;">
                <p style="margin: 0; color: #333; white-space: pre-wrap;">${
                  contactData.message
                }</p>
              </div>
            </div>

            <div style="margin: 30px 0; padding: 20px; background: #e8f4f8; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #333;">
                <strong>📞 Untuk membalas:</strong><br>
                Silakan balas langsung ke email: <a href="mailto:${
                  contactData.email
                }" style="color: #d97706;">${contactData.email}</a>
              </p>
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 5px 0; color: #999; font-size: 12px;">
              Pesan ini dikirim otomatis dari contact form website
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">
              &copy; ${new Date().getFullYear()} ${
      config.shop_name || "Batik Store"
    }. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"${contactData.name}" <${config.smtp_user}>`,
        to: emailTo,
        replyTo: contactData.email,
        subject: `[Contact Form] ${contactData.subject} - dari ${contactData.name}`,
        html: emailTemplate,
      });

      console.log(`Contact form email sent to ${emailTo}`);
      return true;
    } catch (error) {
      console.error("Failed to send contact form email:", error.message);
      return false;
    }
  }
}

module.exports = new EmailService();