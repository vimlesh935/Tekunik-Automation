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
  const questionMarks = (compactSql.match(/\?/g) || []).length;
  const paramCount = values ? values.length : 0;
  
  if (questionMarks !== paramCount) {
    console.error(`[db] ⚠️ PARAMETER MISMATCH! SQL has ${questionMarks} placeholders but ${paramCount} params`);
    console.error("[db] SQL:", compactSql);
    console.error("[db] Params:", JSON.stringify(values));
    console.error("[db] Params types:", values.map(v => typeof v));
    console.error("[db] Stack:", new Error().stack?.split('\n').slice(2, 6).join('\n'));
  } else {
    console.log("[db] SQL:", compactSql.slice(0, 220));
    console.log(`[db] Params (${paramCount}):`, questionMarks > 0 ? JSON.stringify(values).slice(0, 150) : 'none');
  }
  
  try {
    const [rows] = await pool.execute(sql, values);
    return rows;
  } catch (error) {
    console.error(`[db] ❌ EXECUTE ERROR: ${error.message}`);
    console.error("[db] SQL:", compactSql);
    console.error("[db] Params:", JSON.stringify(values));
    console.error("[db] Param count:", paramCount, "| Placeholder count:", questionMarks);
    throw error;
  }
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
