const fs = require('fs');
const db = require('../db');
const sql = fs.readFileSync(__dirname + '/affiliate_schema.sql', 'utf8');

db.query(sql)
  .then(() => {
    console.log('✅ Affiliate schema applied successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error applying affiliate schema:', err);
    process.exit(1);
  });
