// db.js
const mysql = require('mysql2');
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',         // replace with your DB user
  password: 'Agas5740',         // replace with your DB password
  database: 'aai_stock_monitoring'  // your database name
});

db.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to MySQL database!');
});

module.exports = db;
