require('dotenv').config();
const db = require('./server/db');

async function check() {
  const res = await db.query("SELECT indexname FROM pg_indexes WHERE tablename = 'orders'");
  console.log(res.rows);
  process.exit(0);
}
check().catch(console.error);
