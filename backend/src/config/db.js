const mysql = require("mysql2/promise");
const env = require("./env");

const pool = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
});

const query = async (sql, values = []) => {
  const compactSql = sql.replace(/\s+/g, " ").trim();
  console.log("[db] SQL:", compactSql.slice(0, 220));
  const [rows] = await pool.execute(sql, values);
  return rows;
};

const testConnection = async () => {
  const connection = await pool.getConnection();
  connection.release();
  console.log("MySQL Connected");
};

module.exports = {
  pool,
  query,
  testConnection,
};
