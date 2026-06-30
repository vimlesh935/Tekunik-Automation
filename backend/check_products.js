require("dotenv").config();
const { createConnection } = require("mysql2/promise");

async function check() {
  const conn = createConnection({
    host: String(process.env.DB_HOST || "localhost").trim(),
    user: String(process.env.DB_USER || "root").trim(),
    password: String(process.env.DB_PASSWORD || "").trim(),
    database: String(process.env.DB_NAME || "tekunik_website").trim(),
  });

  try {
    const [rows] = await conn.query(
      "SELECT id, product_name, price, stock_quantity, status, created_at FROM products ORDER BY id DESC LIMIT 20",
    );
    console.log("Total products:", rows.length);
    for (const r of rows) {
      console.log(
        `${r.id} | ${r.product_name} | ₹${r.price} | stock=${r.stock_quantity} | status=${r.status} | ${r.created_at}`,
      );
    }
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    await conn.end();
  }
}

check();