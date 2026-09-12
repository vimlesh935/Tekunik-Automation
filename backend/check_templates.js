const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Technique'
  });

  // Check if email_templates table exists
  const [tables] = await conn.execute("SHOW TABLES LIKE 'email_templates'");
  console.log('email_templates table exists:', tables.length > 0);

  if (tables.length > 0) {
    const [rows] = await conn.execute('SELECT template_key, template_name, subject, is_enabled, category FROM email_templates');
    console.log('Templates found:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
  }

  await conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
