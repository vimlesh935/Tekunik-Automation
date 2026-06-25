const mysql = require("mysql2");
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "Technique",
  waitForConnections: true,
  connectionLimit: 5
});

const promisePool = pool.promise();

async function main() {
  try {
    // Check all columns in products table
    const [cols] = await promisePool.execute("SHOW COLUMNS FROM products");
    console.log("=== PRODUCTS TABLE COLUMNS ===");
    cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} (Default: ${c.Default})`));

    // Check products
    const [rows] = await promisePool.execute("SELECT id, name, status, price, stock, image_url, category_id, featured, created_at FROM products ORDER BY id");
    console.log(`\n=== PRODUCTS (${rows.length} total) ===`);
    rows.forEach(r => console.log(JSON.stringify(r)));

    // Count by status
    const [statusCounts] = await promisePool.execute("SELECT status, COUNT(*) as count FROM products GROUP BY status");
    console.log("\n=== PRODUCTS BY STATUS ===");
    statusCounts.forEach(r => console.log(`  ${r.status}: ${r.count}`));

    // Check categories
    const [cats] = await promisePool.execute("SELECT id, name FROM product_categories");
    console.log(`\n=== CATEGORIES (${cats.length}) ===`);
    cats.forEach(c => console.log(`  ${c.id}: ${c.name}`));

    await promisePool.end();
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}

main();