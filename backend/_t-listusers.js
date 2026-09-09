const { query } = require("./src/config/db");
(async () => {
  const search = "%shubham%";
  const limit = 20, offset = 0;
  try {
    const rows = await query(
      `SELECT u.id, u.email, u.role, u.is_verified, up.first_name, up.last_name
       FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE 1=1 AND (u.email LIKE ? OR up.first_name LIKE ? OR up.last_name LIKE ? OR up.phone LIKE ?)
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [search, search, search, search, limit, offset]
    );
    console.log("SUCCESS rows:", rows.length);
    console.log(rows);
  } catch (e) {
    console.log("ERROR:", e.message);
  }
  process.exit(0);
})();
