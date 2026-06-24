/**
 * Run the products table migration to add the missing 'applications' column.
 * 
 * ROOT CAUSE: The products table is missing the `applications` JSON column,
 * which is required by productController.js createProduct() INSERT query.
 * 
 * This caused MySQL error: "Unknown column 'applications' in 'field list'"
 * which was then masked as "Server error" by errorMiddleware.js
 * 
 * Run: node run-migration.js
 */
const { ensureProductsColumns } = require('./src/config/migrate');

(async () => {
  console.log('=== PRODUCTS TABLE MIGRATION ===');
  console.log('Adding missing columns to products table...\n');
  
  try {
    await ensureProductsColumns();
    console.log('\n✅ Migration completed successfully');
    console.log('The `applications` column should now exist in the products table.');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ Migration failed:', e.message);
    process.exit(1);
  }
})();