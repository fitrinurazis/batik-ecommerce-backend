const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn('Email configuration not found. Email features will be disabled.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send order confirmation email
const sendOrderConfirmation = async (orderData) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Konfirmasi Pesanan - Batik E-commerce</h2>

        <p>Halo ${orderData.customer_name},</p>

        <p>Terima kasih atas pesanan Anda. Berikut detail pesanan:</p>

        <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
          <h3>Detail Pesanan #${orderData.id}</h3>
          <p><strong>Email:</strong> ${orderData.customer_email}</p>
          <p><strong>Telepon:</strong> ${orderData.customer_phone}</p>
          <p><strong>Alamat Pengiriman:</strong><br>
             ${orderData.shipping_address}<br>
             ${orderData.shipping_city}, ${orderData.shipping_postal}
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h4>Item Pesanan:</h4>
          ${orderData.items.map(item => `
            <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
              <p><strong>${item.product_name}</strong></p>
              <p>Quantity: ${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}</p>
              <p>Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}</p>
            </div>
          `).join('')}
        </div>

        <div style="background: #e8f5e8; padding: 15px; margin: 15px 0;">
          <p><strong>Subtotal: Rp ${orderData.subtotal.toLocaleString('id-ID')}</strong></p>
          <p><strong>Ongkos Kirim: Rp ${orderData.shipping_cost.toLocaleString('id-ID')}</strong></p>
          <h3><strong>Total: Rp ${orderData.total.toLocaleString('id-ID')}</strong></h3>
        </div>

        <p>Status pesanan Anda saat ini: <strong>${orderData.status}</strong></p>

        <p>Kami akan segera memproses pesanan Anda. Terima kasih!</p>

        <hr>
        <p style="font-size: 12px; color: #666;">
          Email ini dikirim otomatis. Jangan balas email ini.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: orderData.customer_email,
      subject: `Konfirmasi Pesanan #${orderData.id} - Batik E-commerce`,
      html: emailHtml
    });

    return true;

  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Send low stock alert
const sendLowStockAlert = async (products) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Alert: Stok Produk Menipis</h2>

        <p>Produk berikut memiliki stok yang menipis dan perlu segera direstok:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Produk</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Stok</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Kategori</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(product => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; ${product.stock === 0 ? 'color: red; font-weight: bold;' : 'color: orange;'}">${product.stock}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.category}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <p>Silakan login ke admin panel untuk mengupdate stok produk.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to admin
      subject: 'Alert: Stok Produk Menipis - Batik E-commerce',
      html: emailHtml
    });

    return true;

  } catch (error) {
    console.error('Low stock email send error:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendLowStockAlert
};