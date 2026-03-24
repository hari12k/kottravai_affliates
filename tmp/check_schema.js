require('dotenv').config({path: './server/.env'});
const db = require('./server/db');
db.query("SELECT * FROM affiliates LIMIT 0")
  .then(r => console.log(r.fields.map(f => f.name)))
  .catch(e => console.error(e))
  .finally(() => db.end());
