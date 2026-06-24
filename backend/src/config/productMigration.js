const { query } = require("./db");

const hasColumn = async (tableName, columnName) => {
  const columns = await query(`SHOW COLUMNS FROM ${tableName}`);
  return columns.some((column) => column.Field === columnName);
};

const hasTable = async (tableName) => {
  const [table] = await query(
    "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName]
  );
  return !!table;
};

const addColumnIfMissing = async (tableName, columnDefinition, columnName) => {
  if (await hasColumn(tableName, columnName)) return;
  await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  console.log(`✅ Added column ${columnName} to ${tableName}`);
};

const ensureProductUpgradeTables = async () => {
  try {
    // 1. Subcategories
    if (!(await hasTable("subcategories"))) {
      await query(`
        CREATE TABLE subcategories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE,
          INDEX idx_subcat_category (category_id)
        )
      `);
      console.log("✅ Created subcategories table");
    }

    // 2. Add new product columns
    await addColumnIfMissing("products", "short_description TEXT NULL AFTER description", "short_description");
    await addColumnIfMissing("products", "sale_price DECIMAL(10,2) NULL AFTER price", "sale_price");
    await addColumnIfMissing("products", "discount_percent DECIMAL(5,2) NULL AFTER sale_price", "discount_percent");
    await addColumnIfMissing("products", "subcategory_id INT NULL AFTER category_id", "subcategory_id");

    // 3. Product gallery images
    if (!(await hasTable("product_images"))) {
      await query(`
        CREATE TABLE product_images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          image_url VARCHAR(500) NOT NULL,
          is_main TINYINT(1) NOT NULL DEFAULT 0,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          INDEX idx_pimages_product (product_id),
          INDEX idx_pimages_sort (product_id, sort_order)
        )
      `);
      console.log("✅ Created product_images table");
    }

    // 4. Product colors
    if (!(await hasTable("product_colors"))) {
      await query(`
        CREATE TABLE product_colors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          color_name VARCHAR(50) NOT NULL,
          color_code VARCHAR(20) NOT NULL,
          stock_quantity INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          INDEX idx_pcolors_product (product_id)
        )
      `);
      console.log("✅ Created product_colors table");
    }

    // 5. Product sizes
    if (!(await hasTable("product_sizes"))) {
      await query(`
        CREATE TABLE product_sizes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          size_name VARCHAR(50) NOT NULL,
          stock_quantity INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          INDEX idx_psizes_product (product_id)
        )
      `);
      console.log("✅ Created product_sizes table");
    }

    // 6. Category image columns
    await addColumnIfMissing("product_categories", "thumbnail_image VARCHAR(500) NULL AFTER image_url", "thumbnail_image");
    await addColumnIfMissing("product_categories", "banner_image VARCHAR(500) NULL AFTER thumbnail_image", "banner_image");
    await addColumnIfMissing("product_categories", "icon_image VARCHAR(500) NULL AFTER banner_image", "icon_image");

    console.log("✅ Product upgrade migration completed");
  } catch (error) {
    console.error("❌ Product migration error:", error.message);
  }
};

module.exports = { ensureProductUpgradeTables };
