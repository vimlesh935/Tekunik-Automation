// Diagnostic script to check database products and API
const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "Technique"
  });

  try {
    // 1. Check products table columns
    const [cols] = await conn.execute("SHOW COLUMNS FROM products");
    console.log("=== PRODUCTS COLUMNS ===");
    cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} | Null: ${c.Null} | Default: ${c.Default}`));

    // 2. Check all products with status
    const [products] = await conn.execute(
      "SELECT id, name, status, featured, price, stock, image_url, category_id, created_at FROM products ORDER BY id"
    );
    console.log(`\n=== ALL PRODUCTS (${products.length}) ===`);
    products.forEach(p => console.log(`  ID=${p.id} | "${p.name}" | status=${p.status} | featured=${p.featured} | cat=${p.category_id} | price=${p.price}`));

    // 3. Check categories
    const [cats] = await conn.execute("SELECT id, name FROM product_categories");
    console.log(`\n=== CATEGORIES (${cats.length}) ===`);
    cats.forEach(c => console.log(`  ${c.id}: ${c.name}`));

    // 4. Count active products
    const [active] = await conn.execute("SELECT COUNT(*) as count FROM products WHERE status='active'");
    console.log(`\n=== ACTIVE PRODUCTS: ${active[0].count}`);

    // 5. Check featured + active
    const [featuredActive] = await conn.execute("SELECT COUNT(*) as count FROM products WHERE status='active' AND featured=1");
    console.log(`=== FEATURED+ACTIVE: ${featuredActive[0].count}`);

    // 6. Check product_images
    const [images] = await conn.execute("SELECT id, product_id, image_url FROM product_images LIMIT 10");
    console.log(`\n=== PRODUCT IMAGES (${images.length}) ===`);
    images.forEach(i => console.log(`  id=${i.id} | product_id=${i.product_id} | url=${i.image_url}`));

    // 7. Check for any migration issues - if category doesn't exist
    const [orphans] = await conn.execute(`
      SELECT p.id, p.name, p.category_id FROM products p 
      LEFT JOIN product_categories c ON p.category_id = c.id 
      WHERE c.id IS NULL AND p.category_id IS NOT NULL
    `);
    if (orphans.length > 0) {
      console.log(`\n⚠️ ORPHAN PRODUCTS (category missing): ${orphans.length}`);
      orphans.forEach(p => console.log(`  ${p.id}: ${p.name} (category_id=${p.category_id})`));
    } else {
      console.log("\n✓ No orphan products found");
    }

    // 8. Test product listing query that the PUBLIC API would use
    console.log("\n=== SIMULATING PUBLIC API QUERY ===");
    const [publicProducts] = await conn.execute(`
      SELECT p.id, p.name, p.status, p.price, p.stock, p.image_url, pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 20
    `);
    console.log(`Public API would return ${publicProducts.length} products`);
    if (publicProducts.length === 0) {
      console.log("❌ CRITICAL: No active products found!");
      // Check what statuses are available
      const [statuses] = await conn.execute("SELECT status, COUNT(*) as cnt FROM products GROUP BY status");
      console.log("Products by status:");
      statuses.forEach(s => console.log(`  ${s.status}: ${s.cnt}`));
    } else {
      publicProducts.forEach(p => console.log(`  ${p.name} | status=${p.status} | price=${p.price}`));
    }

  } catch(e) {
    console.error("ERROR:", e.message);
    console.error(e.stack);
  } finally {
    await conn.end();
  }
}

main();