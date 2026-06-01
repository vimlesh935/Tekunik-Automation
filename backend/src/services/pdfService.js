const PDFDocument = require("pdfkit");
const fs = require("node:fs");
const path = require("node:path");

const INVOICES_DIR = path.join(__dirname, "..", "..", "invoices");

const ensureInvoicesDir = () => {
  if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
  }
};

const generateInvoicePDF = async (order, items, companyInfo = {}) => {
  ensureInvoicesDir();

  const invoiceNumber = order.invoice_number || `INV-${order.order_number}`;
  const fileName = `${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  const filePath = path.join(INVOICES_DIR, fileName);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        info: {
          Title: `Invoice ${invoiceNumber}`,
          Author: "Tekunik",
          Subject: "Order Invoice",
        },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ── Colours ──────────────────────────────────────────────────────────
      const CYAN       = "#06b6d4";
      const CYAN_DARK  = "#0e7490";
      const NAVY       = "#0f172a";
      const SLATE      = "#334155";
      const MUTED      = "#64748b";
      const LIGHT      = "#cbd5e1";
      const PALE       = "#f1f5f9";
      const WHITE      = "#ffffff";
      const GREEN      = "#059669";
      const AMBER      = "#d97706";
      const RED        = "#dc2626";

      // ── Helpers ───────────────────────────────────────────────────────────
      const W = 595;   // A4 width in points
      const L = 40;    // left margin
      const R = 555;   // right edge
      const CW = R - L; // content width = 515

      const fmt = (n) =>
        `Rs. ${parseFloat(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

      const dateStr = new Date(order.created_at || Date.now()).toLocaleDateString(
        "en-IN",
        { year: "numeric", month: "long", day: "numeric" }
      );

      // ── Computed amounts ──────────────────────────────────────────────────
      const totalVal   = parseFloat(order.total_amount) || 0;
      const taxAmount  = parseFloat((totalVal - totalVal / 1.18).toFixed(2));
      const baseAmount = parseFloat((totalVal - taxAmount).toFixed(2));

      // ─────────────────────────────────────────────────────────────────────
      // 1. HEADER  (full-width dark band, height 130)
      // ─────────────────────────────────────────────────────────────────────
      doc.rect(0, 0, W, 130).fill(NAVY);

      // cyan left accent bar
      doc.rect(0, 0, 6, 130).fill(CYAN);

      // Brand
      doc.fontSize(32).font("Helvetica-Bold").fillColor(WHITE).text("TEKUNIK", L + 10, 28);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(LIGHT)
        .text("Premium IoT Solutions & Electronics", L + 10, 68);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(MUTED)
        .text("vimleshnew29@gmail.com  |  +91 00000 00000", L + 10, 84);

      // INVOICE label (right)
      doc
        .fontSize(36)
        .font("Helvetica-Bold")
        .fillColor(CYAN)
        .text("INVOICE", 0, 22, { width: R, align: "right" });

      // Meta info (right column)
      const metaRight = R;
      let mY = 68;
      const metaLine = (label, value, color = LIGHT) => {
        doc.fontSize(8).font("Helvetica").fillColor(MUTED).text(label, 0, mY, { width: metaRight - 110, align: "right" });
        doc.fontSize(8).font("Helvetica-Bold").fillColor(color).text(value, 0, mY, { width: metaRight, align: "right" });
        mY += 14;
      };
      metaLine("Invoice #", invoiceNumber, WHITE);
      metaLine("Order #", order.order_number, LIGHT);
      metaLine("Date", dateStr, LIGHT);
      if (order.tracking_number) metaLine("Tracking #", order.tracking_number, AMBER);

      // ─────────────────────────────────────────────────────────────────────
      // 2. FROM / BILL TO  cards
      // ─────────────────────────────────────────────────────────────────────
      const cardY  = 148;
      const cardH  = 110;
      const halfW  = (CW - 12) / 2;   // gap = 12

      // card backgrounds
      doc.roundedRect(L, cardY, halfW, cardH, 4).fill(PALE);
      doc.roundedRect(L + halfW + 12, cardY, halfW, cardH, 4).fill(PALE);

      // cyan top strip on each card
      doc.roundedRect(L, cardY, halfW, 6, 4).fill(CYAN);
      doc.roundedRect(L + halfW + 12, cardY, halfW, 6, 4).fill(CYAN);

      // FROM
      const fx = L + 12;
      doc.fontSize(7).font("Helvetica-Bold").fillColor(CYAN).text("FROM", fx, cardY + 14);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text("Tekunik Technologies", fx, cardY + 26);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(SLATE)
        .text("123 Innovation Drive, Tech City", fx, cardY + 42)
        .text("vimleshnew29@gmail.com", fx, cardY + 56)
        .text("+91 00000 00000", fx, cardY + 70)
        .text("GSTIN: 27XXXXX0000X1ZX", fx, cardY + 84);

      // BILL TO
      const bx = L + halfW + 12 + 12;
      const bw = halfW - 24;

      const customerName    = order.guest_name || order.customer_name || "Customer";
      const customerEmail   = order.guest_email || order.customer_email || "";
      const customerPhone   = order.guest_phone || "";
      const deliveryAddress = order.delivery_address || "";
      const city            = order.guest_city || "";
      const state           = order.guest_state || "";
      const pincode         = order.guest_pincode || "";
      const cityLine        = [city, state].filter(Boolean).join(", ") + (pincode ? " - " + pincode : "");

      doc.fontSize(7).font("Helvetica-Bold").fillColor(CYAN).text("BILL TO", bx, cardY + 14);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text(customerName, bx, cardY + 26, { width: bw });

      let bY = cardY + 42;
      doc.fontSize(8).font("Helvetica").fillColor(SLATE);
      if (deliveryAddress) { doc.text(deliveryAddress, bx, bY, { width: bw }); bY += 14; }
      if (cityLine)        { doc.text(cityLine, bx, bY, { width: bw }); bY += 14; }
      if (customerEmail)   { doc.text(customerEmail, bx, bY, { width: bw }); bY += 14; }
      if (customerPhone)   { doc.text(customerPhone, bx, bY, { width: bw }); }

      // ─────────────────────────────────────────────────────────────────────
      // 3. PAYMENT INFO  strip
      // ─────────────────────────────────────────────────────────────────────
      const pBarY = cardY + cardH + 14;
      doc.rect(L, pBarY, CW, 30).fill(NAVY);

      const pStatus = String(order.payment_status || "pending").toLowerCase();
      const pMethod = String(order.payment_method || "COD").toUpperCase();
      const pColor  = pStatus === "paid" ? GREEN : pStatus === "failed" ? RED : AMBER;

      // left: method
      doc.fontSize(7).font("Helvetica").fillColor(MUTED).text("PAYMENT METHOD", L + 12, pBarY + 7);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(WHITE).text(pMethod, L + 12, pBarY + 17);

      // center divider
      doc.moveTo(L + CW / 2, pBarY + 6).lineTo(L + CW / 2, pBarY + 24).strokeColor(SLATE).lineWidth(1).stroke();

      // right: status
      doc.fontSize(7).font("Helvetica").fillColor(MUTED).text("PAYMENT STATUS", L + CW / 2 + 12, pBarY + 7);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(pColor).text(pStatus.toUpperCase(), L + CW / 2 + 12, pBarY + 17);

      // ─────────────────────────────────────────────────────────────────────
      // 4. ITEMS TABLE
      // ─────────────────────────────────────────────────────────────────────
      const tY = pBarY + 44;

      // column x positions & widths
      const col = {
        num:   { x: L,        w: 24  },
        name:  { x: L + 28,   w: 220 },
        qty:   { x: L + 258,  w: 50  },
        price: { x: L + 318,  w: 95  },
        total: { x: L + 418,  w: 97  },
      };

      // Table header row
      doc.rect(L, tY, CW, 26).fill(CYAN_DARK);
      const thY = tY + 8;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(WHITE);
      doc.text("#",           col.num.x + 4,  thY, { width: col.num.w });
      doc.text("PRODUCT",     col.name.x,     thY, { width: col.name.w });
      doc.text("QTY",         col.qty.x,      thY, { width: col.qty.w,   align: "center" });
      doc.text("UNIT PRICE",  col.price.x,    thY, { width: col.price.w, align: "right" });
      doc.text("AMOUNT",      col.total.x,    thY, { width: col.total.w, align: "right" });

      let rowY   = tY + 26;
      let rowNum = 1;

      for (const item of items) {
        if (rowY > 700) {
          doc.addPage();
          rowY = 40;
        }

        const rowH      = 26;
        const itemTotal = parseFloat(item.price) * item.quantity;
        const isEven    = rowNum % 2 === 0;

        // row background
        doc.rect(L, rowY, CW, rowH).fill(isEven ? PALE : WHITE);

        // left cyan accent per row
        doc.rect(L, rowY, 3, rowH).fill(isEven ? CYAN : "#e2e8f0");

        // bottom border
        doc
          .moveTo(L, rowY + rowH)
          .lineTo(R, rowY + rowH)
          .strokeColor("#e2e8f0")
          .lineWidth(0.5)
          .stroke();

        const ty = rowY + 8;
        doc.fontSize(8).font("Helvetica").fillColor(MUTED);
        doc.text(String(rowNum),                 col.num.x + 4,  ty, { width: col.num.w });
        doc.text(item.product_name || "Product", col.name.x,     ty, { width: col.name.w });
        doc.text(String(item.quantity),          col.qty.x,      ty, { width: col.qty.w,   align: "center" });
        doc.text(fmt(item.price),                col.price.x,    ty, { width: col.price.w, align: "right" });

        doc.fontSize(8).font("Helvetica-Bold").fillColor(NAVY);
        doc.text(fmt(itemTotal),                 col.total.x,    ty, { width: col.total.w, align: "right" });

        rowY += rowH;
        rowNum++;
      }

      // ─────────────────────────────────────────────────────────────────────
      // 5. TOTALS  block (right-aligned card)
      // ─────────────────────────────────────────────────────────────────────
      rowY += 16;

      const totCardX = L + CW - 220;
      const totCardW = 220;

      // card bg
      doc.roundedRect(totCardX, rowY, totCardW, 90, 4).fill(PALE);
      doc.roundedRect(totCardX, rowY, totCardW, 4, 4).fill(CYAN);

      let tRow = rowY + 14;

      const summaryRow = (label, value, bold = false, valColor = SLATE) => {
        doc.fontSize(8).font("Helvetica").fillColor(MUTED)
          .text(label, totCardX + 10, tRow, { width: 100 });
        doc.fontSize(8).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(valColor)
          .text(value, totCardX + 10, tRow, { width: totCardW - 20, align: "right" });
        tRow += 16;
      };

      summaryRow("Subtotal",          fmt(baseAmount));
      summaryRow("Shipping",          "FREE", false, GREEN);
      summaryRow("GST (18% incl.)",   fmt(taxAmount));

      // divider inside card
      doc.moveTo(totCardX + 10, tRow).lineTo(totCardX + totCardW - 10, tRow)
        .strokeColor(LIGHT).lineWidth(0.8).stroke();
      tRow += 8;

      // Grand total row inside card
      doc.fontSize(9).font("Helvetica-Bold").fillColor(NAVY)
        .text("TOTAL", totCardX + 10, tRow, { width: 100 });
      doc.fontSize(12).font("Helvetica-Bold").fillColor(CYAN)
        .text(fmt(totalVal), totCardX + 10, tRow - 2, { width: totCardW - 20, align: "right" });

      // ─────────────────────────────────────────────────────────────────────
      // 6. THANK YOU  note (left of totals)
      // ─────────────────────────────────────────────────────────────────────
      const noteX = L;
      const noteW = totCardX - L - 16;
      const noteY = rowY + 10;

      doc.roundedRect(noteX, noteY, noteW, 70, 4).fill(PALE);
      doc.roundedRect(noteX, noteY, noteW, 4, 4).fill(CYAN);

      doc.fontSize(11).font("Helvetica-Bold").fillColor(NAVY)
        .text("Thank you for your order!", noteX + 12, noteY + 14, { width: noteW - 24 });
      doc.fontSize(8).font("Helvetica").fillColor(SLATE)
        .text(
          `Estimated Delivery: ${order.estimated_delivery || "3-5 Business Days"}`,
          noteX + 12, noteY + 32, { width: noteW - 24 }
        );
      doc.fontSize(7).font("Helvetica").fillColor(MUTED)
        .text(
          "For queries, contact us at vimleshnew29@gmail.com",
          noteX + 12, noteY + 48, { width: noteW - 24 }
        );

      // ─────────────────────────────────────────────────────────────────────
      // 7. FOOTER  band
      // ─────────────────────────────────────────────────────────────────────
      const footerY = 800;

      doc.rect(0, footerY, W, 42).fill(NAVY);
      doc.rect(0, footerY, W, 3).fill(CYAN);

      doc.fontSize(7).font("Helvetica").fillColor(MUTED)
        .text(
          "Tekunik Technologies  |  vimleshnew29@gmail.com  |  +91 00000 00000",
          0, footerY + 10, { width: W, align: "center" }
        )
        .text(
          "This is a computer-generated invoice and does not require a physical signature.",
          0, footerY + 24, { width: W, align: "center" }
        );

      // ─────────────────────────────────────────────────────────────────────
      doc.end();

      stream.on("finish", () => {
        console.log(`✅ [PDF] Invoice generated: ${filePath}`);
        resolve({ filePath, fileName, invoiceNumber });
      });

      stream.on("error", (err) => {
        console.error("❌ [PDF] Stream error:", err);
        reject(err);
      });
    } catch (error) {
      console.error("❌ [PDF] Generation error:", error);
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  INVOICES_DIR,
};
