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
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
  idleTimeout: 60000,
});

const query = async (sql, values = []) => {
  const compactSql = sql.replace(/\s+/g, " ").trim();
  const questionMarks = (compactSql.match(/\?/g) || []).length;
  const paramCount = values ? values.length : 0;
  
  if (questionMarks !== paramCount) {
    console.error(`[db] ⚠️ PARAMETER MISMATCH! SQL has ${questionMarks} placeholders but ${paramCount} params`);
    console.error("[db] SQL:", compactSql);
    console.error("[db] Params:", JSON.stringify(values));
    console.error("[db] Stack:", new Error().stack?.split('\n').slice(2, 6).join('\n'));
  }
  
  try {
    const [rows] = await pool.execute(sql, values);
    return rows;
  } catch (error) {
    const isConnError = error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR';
    if (isConnError) {
      console.error(`[db] ⚠️ Connection lost, retrying once: ${error.message}`);
      await new Promise(r => setTimeout(r, 200));
      try {
        const [rows] = await pool.execute(sql, values);
        return rows;
      } catch (retryErr) {
        console.error(`[db] ❌ RETRY ALSO FAILED: ${retryErr.message}`);
        throw retryErr;
      }
    }
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
