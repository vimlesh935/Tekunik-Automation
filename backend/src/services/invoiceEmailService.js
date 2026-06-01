const nodemailer = require("nodemailer");
const fs = require("node:fs");
const path = require("node:path");
const env = require("../config/env");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

const buildInvoiceEmailHTML = (order, items, invoiceNumber) => {
  const customerName = order.guest_name || "Valued Customer";
  const totalVal = parseFloat(order.total_amount);
  const taxAmount = (totalVal - (totalVal / 1.18)).toFixed(2);
  const baseAmount = (totalVal / 1.18).toFixed(2);

  const itemsRows = items.map((item, index) => {
    const itemTotal = (parseFloat(item.price) * item.quantity).toFixed(2);
    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #94a3b8; font-size: 13px;">${index + 1}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #ffffff; font-size: 13px; font-weight: 500;">${item.product_name}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #94a3b8; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #94a3b8; font-size: 13px; text-align: right;">₹${parseFloat(item.price).toLocaleString('en-IN')}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #06b6d4; font-size: 13px; font-weight: 600; text-align: right;">₹${parseFloat(itemTotal).toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join("");

  const deliveryAddress = order.delivery_address || "N/A";
  const city = [order.guest_city, order.guest_state, order.guest_pincode].filter(Boolean).join(", ") || "N/A";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #f1f5f9; }
        .container { max-width: 620px; margin: 0 auto; padding: 32px 20px; }
        .card { background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; margin-bottom: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .header-accent { background: linear-gradient(90deg, #06b6d4, #2563eb); height: 4px; border-radius: 2px; margin-bottom: 28px; }
        .logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -1px; }
        .logo span { color: #06b6d4; }
        .badge { display: inline-block; background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(37,99,235,0.15)); border: 1px solid rgba(6,182,212,0.25); border-radius: 100px; padding: 6px 16px; font-size: 11px; font-weight: 600; color: #22d3ee; text-transform: uppercase; letter-spacing: 1.5px; }
        .invoice-title { font-size: 32px; font-weight: 800; color: #ffffff; margin-top: 16px; }
        .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); }
        .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 4px; }
        .meta-value { font-size: 14px; font-weight: 600; color: #f1f5f9; }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #06b6d4; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        table { width: 100%; border-collapse: collapse; }
        th { background: rgba(6,182,212,0.08); padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; text-align: left; }
        th:last-child, td:last-child { text-align: right; }
        .total-row td { padding: 12px 16px; font-size: 14px; border-top: 2px solid #06b6d4; }
        .grand-total { font-size: 20px; font-weight: 800; color: #06b6d4; text-align: right; }
        .address-box { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); margin-top: 12px; }
        .address-box p { font-size: 13px; color: #cbd5e1; line-height: 1.6; }
        .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 24px; }
        .footer p { font-size: 12px; color: #64748b; line-height: 1.8; }
        .status-paid { color: #34d399; font-weight: 600; }
        .status-pending { color: #fbbf24; font-weight: 600; }
        @media only screen and (max-width: 480px) {
          .card { padding: 20px; }
          .invoice-title { font-size: 24px; }
          .invoice-meta { grid-template-columns: 1fr; }
          table { font-size: 12px; }
          th, td { padding: 8px 10px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="card" style="text-align: center;">
          <div class="header-accent"></div>
          <div class="logo">TEKU<span>NIK</span></div>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase;">Premium IoT Solutions</p>
          <div style="margin-top: 20px;">
            <span class="badge">✅ Invoice Generated</span>
          </div>
          <h1 class="invoice-title">Invoice #${invoiceNumber}</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">Order #${order.order_number}</p>
        </div>

        <!-- Invoice Meta -->
        <div class="card">
          <div class="invoice-meta">
            <div>
              <div class="meta-label">Invoice Date</div>
              <div class="meta-value">${new Date(order.created_at || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div>
              <div class="meta-label">Payment Method</div>
              <div class="meta-value">${order.payment_method === "online" ? "Online Payment" : "Cash on Delivery"}</div>
            </div>
            <div>
              <div class="meta-label">Payment Status</div>
              <div class="meta-value ${order.payment_status === "paid" ? "status-paid" : "status-pending"}">${order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || "Pending"}</div>
            </div>
            <div>
              <div class="meta-label">Order Status</div>
              <div class="meta-value" style="text-transform: capitalize;">${order.status}</div>
            </div>
          </div>
        </div>

        <!-- Customer & Shipping -->
        <div class="card">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <div class="section-title">Bill To</div>
              <p style="font-size: 15px; font-weight: 600; color: #f1f5f9;">${customerName}</p>
              ${order.guest_email ? `<p style="font-size: 13px; color: #94a3b8;">${order.guest_email}</p>` : ""}
              ${order.guest_phone ? `<p style="font-size: 13px; color: #94a3b8;">${order.guest_phone}</p>` : ""}
            </div>
            <div>
              <div class="section-title">Ship To</div>
              <div class="address-box">
                <p>${deliveryAddress}</p>
                <p>${city}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="card" style="padding: 24px;">
          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Product</th>
                <th style="text-align: center; width: 50px;">Qty</th>
                <th style="text-align: right; width: 90px;">Price</th>
                <th style="text-align: right; width: 90px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); text-align: right;">
            <div style="display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0;">
              <span style="color: #94a3b8; font-size: 14px;">Base Amount:</span>
              <span style="color: #f1f5f9; font-size: 14px; font-weight: 600; min-width: 100px; display: inline-block; text-align: right;">₹${parseFloat(baseAmount).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0;">
              <span style="color: #94a3b8; font-size: 14px;">Shipping:</span>
              <span style="color: #34d399; font-size: 14px; min-width: 100px; display: inline-block; text-align: right;">FREE</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0;">
              <span style="color: #94a3b8; font-size: 14px;">GST (18% Incl.):</span>
              <span style="color: #f1f5f9; font-size: 14px; min-width: 100px; display: inline-block; text-align: right;">₹${parseFloat(taxAmount).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 40px; padding: 8px 0; margin-top: 8px; border-top: 2px solid #06b6d4;">
              <span style="color: #06b6d4; font-size: 18px; font-weight: 700;">Grand Total:</span>
              <span style="color: #06b6d4; font-size: 22px; font-weight: 800; min-width: 120px; display: inline-block; text-align: right;">₹${totalVal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Delivery Estimate -->
        <div class="card" style="text-align: center; background: linear-gradient(145deg, rgba(6,182,212,0.08), rgba(37,99,235,0.05));">
          <p style="font-size: 14px; color: #22d3ee; font-weight: 600;">🚚 Estimated Delivery</p>
          <p style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 8px;">${order.estimated_delivery || "3-5 Business Days"}</p>
          <p style="font-size: 13px; color: #64748b; margin-top: 8px;">Track your order anytime using your order number.</p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p style="font-size: 14px; color: #94a3b8;">Thank you for choosing <strong style="color: #06b6d4;">Tekunik</strong>!</p>
          <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Tekunik Technologies • Email: vimleshnew29@gmail.com</p>
          <p style="font-size: 11px; color: #475569; margin-top: 4px;">This is an automated invoice. No signature required.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendInvoiceEmail = async ({ order, items, pdfPath, invoiceNumber }) => {
  try {
    const smtp = getTransporter();
    const customerName = order.guest_name || "Valued Customer";
    const totalAmount = parseFloat(order.total_amount).toFixed(2);
    const htmlContent = buildInvoiceEmailHTML(order, items, invoiceNumber);

    // Primary recipients
    const recipients = ["vimleshnew29@gmail.com"];
    if (order.guest_email && order.guest_email !== "vimleshnew29@gmail.com") {
      recipients.push(order.guest_email);
    }
    if (order.user_email && !recipients.includes(order.user_email)) {
      recipients.push(order.user_email);
    }

    const recipientEmails = [...new Set(recipients)].join(", ");

    const mailOptions = {
      from: `"Tekunik" <${env.smtp.user}>`,
      to: recipientEmails,
      subject: `Invoice #${invoiceNumber} - Your Order from Tekunik`,
      html: htmlContent,
      attachments: pdfPath
        ? [
            {
              filename: `Invoice_${invoiceNumber}.pdf`,
              path: pdfPath,
              contentType: "application/pdf",
            },
          ]
        : [],
    };

    console.log(`[InvoiceEmail] Sending invoice to: ${recipientEmails}`);
    const info = await smtp.sendMail(mailOptions);

    console.log("✅ [InvoiceEmail] Invoice email sent successfully:", {
      recipients: recipientEmails,
      messageId: info.messageId,
      invoiceNumber,
    });

    return { success: true, messageId: info.messageId, recipients: recipientEmails };
  } catch (error) {
    console.error("❌ [InvoiceEmail] Failed to send invoice email:", error.message);
    console.error("   Stack:", error.stack);
    // Don't throw - we don't want to break the order flow if email fails
    return { success: false, error: error.message };
  }
};

// Simple invoice email without PDF attachment (fallback)
const sendInvoiceEmailSimple = async ({ order, items, invoiceNumber }) => {
  return sendInvoiceEmail({ order, items, pdfPath: null, invoiceNumber });
};

module.exports = {
  sendInvoiceEmail,
  sendInvoiceEmailSimple,
};