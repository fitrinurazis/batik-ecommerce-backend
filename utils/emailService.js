const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendOrderConfirmation(orderData, customerEmail) {
    if (!this.transporter || !process.env.SMTP_USER) {
      console.log('Email not configured, skipping order confirmation');
      return false;
    }

    const emailTemplate = this.getOrderConfirmationTemplate(orderData);

    try {
      await this.transporter.sendMail({
        from: `"${process.env.SHOP_NAME || 'Batik Store'}" <${process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Konfirmasi Pesanan #${orderData.id}`,
        html: emailTemplate
      });

      console.log(`Email konfirmasi pesanan dikirim ke ${customerEmail}`);
      return true;
    } catch (error) {
      console.error('Gagal mengirim email:', error.message);
      return false;
    }
  }

  async sendOrderStatusUpdate(orderData, customerEmail, newStatus) {
    if (!this.transporter || !process.env.SMTP_USER) {
      console.log('Email not configured, skipping status update');
      return false;
    }

    const emailTemplate = this.getStatusUpdateTemplate(orderData, newStatus);

    try {
      await this.transporter.sendMail({
        from: `"${process.env.SHOP_NAME || 'Batik Store'}" <${process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Update Status Pesanan #${orderData.id}`,
        html: emailTemplate
      });

      console.log(`Email update status dikirim ke ${customerEmail}`);
      return true;
    } catch (error) {
      console.error('Gagal mengirim email update status:', error.message);
      return false;
    }
  }

  async sendAdminNotification(orderData) {
    if (!this.transporter || !process.env.SMTP_USER || !process.env.ADMIN_EMAIL) {
      console.log('Email not configured, skipping admin notification');
      return false;
    }

    const emailTemplate = this.getAdminNotificationTemplate(orderData);

    try {
      await this.transporter.sendMail({
        from: `"${process.env.SHOP_NAME || 'Batik Store'}" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Pesanan Baru #${orderData.id}`,
        html: emailTemplate
      });

      console.log('Email notifikasi admin dikirim');
      return true;
    } catch (error) {
      console.error('Gagal mengirim email notifikasi admin:', error.message);
      return false;
    }
  }

  getOrderConfirmationTemplate(orderData) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(amount);
    };

    const itemsHtml = orderData.items?.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name || 'Produk'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('') || '';

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
              <p><strong>Subtotal: ${formatCurrency(orderData.subtotal)}</strong></p>
              ${orderData.shipping_cost ? `<p>Ongkir: ${formatCurrency(orderData.shipping_cost)}</p>` : ''}
              <h3 style="color: #d4691a;">Total: ${formatCurrency(orderData.total)}</h3>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #e8f4f8; border-radius: 5px;">
              <p><strong>Status Pesanan:</strong> ${orderData.status || 'Pending'}</p>
              <p>Kami akan segera memproses pesanan Anda. Anda akan menerima email update ketika status pesanan berubah.</p>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0; color: #666; font-size: 12px;">
            <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Batik Store'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getStatusUpdateTemplate(orderData, newStatus) {
    const statusMessages = {
      'pending': 'Pesanan Anda sedang menunggu konfirmasi',
      'processing': 'Pesanan Anda sedang diproses',
      'shipped': 'Pesanan Anda telah dikirim',
      'delivered': 'Pesanan Anda telah sampai di tujuan',
      'cancelled': 'Pesanan Anda telah dibatalkan'
    };

    const statusColors = {
      'pending': '#f39c12',
      'processing': '#3498db',
      'shipped': '#9b59b6',
      'delivered': '#27ae60',
      'cancelled': '#e74c3c'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Update Status Pesanan</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Update Status Pesanan</h1>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #333;">Pesanan #${orderData.id}</h2>

            <div style="margin: 20px 0; padding: 20px; background: ${statusColors[newStatus] || '#333'}; color: white; border-radius: 5px; text-align: center;">
              <h3 style="margin: 0;">${statusMessages[newStatus] || 'Status pesanan telah diupdate'}</h3>
            </div>

            <div style="margin: 20px 0;">
              <h3>Detail Pesanan:</h3>
              <p><strong>Nama Pelanggan:</strong> ${orderData.customer_name}</p>
              <p><strong>Total Pesanan:</strong> ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(orderData.total)}</p>
              <p><strong>Tanggal Pesanan:</strong> ${new Date(orderData.created_at).toLocaleDateString('id-ID')}</p>
            </div>

            ${newStatus === 'shipped' ? `
              <div style="margin: 20px 0; padding: 15px; background: #e8f4f8; border-radius: 5px;">
                <p><strong>Informasi Pengiriman:</strong></p>
                <p>Pesanan Anda telah dikirim ke alamat: ${orderData.shipping_address}, ${orderData.shipping_city}</p>
                <p>Estimasi tiba: 2-3 hari kerja</p>
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin: 20px 0; color: #666; font-size: 12px;">
            <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Batik Store'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getAdminNotificationTemplate(orderData) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
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
              <p><strong>Alamat:</strong> ${orderData.shipping_address}, ${orderData.shipping_city} ${orderData.shipping_postal}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3>Detail Pesanan:</h3>
              <p><strong>Total Pesanan:</strong> ${formatCurrency(orderData.total)}</p>
              <p><strong>Waktu Pesanan:</strong> ${new Date(orderData.created_at).toLocaleString('id-ID')}</p>
              <p><strong>Status:</strong> ${orderData.status || 'Pending'}</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <p><strong>Tindakan Diperlukan:</strong></p>
              <p>Silakan login ke admin panel untuk memproses pesanan ini.</p>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0; color: #666; font-size: 12px;">
            <p>Email notifikasi admin</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Batik Store'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testEmailConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Email transporter not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();