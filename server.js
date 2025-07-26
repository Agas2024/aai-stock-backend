const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');


const app = express();


const allowedOrigins = ['https://aai-stock-monitoring-ojjcgdnjk-stock-monitoring.vercel.app/']; // replace with actual domain
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());


// MySQL connection
require('dotenv').config(); // add this at top

// MySQL connection using env variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10), // ensure port is a number
});


db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
  } else {
    console.log('✅ Connected to MySQL!');
  }
});

// GET all products
app.get('/api/products', (req, res) => {
  const sql = `
    SELECT 
      \`INSTALL DATE\` AS installDate,
      \`SUPPLIED BY\` AS suppliedBy,
      \`SUPPLY ORDER NO\` AS supplyOrderNo,
      \`ASSET ID\` AS assetId,
      \`MAKE\` AS make,
      \`MODEL\` AS model,
      \`SERIAL NO\` AS serialNumber,
      \`LOCATION\` AS location,
      \`DEP\` AS department,
      \`REMARKS\` AS remarks,
      \`ITEM\` AS item
    FROM \`project details\`
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// INSERT a new product
app.post('/api/products', (req, res) => {
  const {
    installDate, suppliedBy, supplyOrderNo, assetId,
    make, model, serialNumber, location, department, remarks, item
  } = req.body;

  const checkSql = 'SELECT * FROM `project details` WHERE `ASSET ID` = ?';
  db.query(checkSql, [assetId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length > 0) {
      return res.status(400).json({ error: '❌ Asset ID already exists!' });
    }

    const insertSql = `
      INSERT INTO \`project details\` (
        \`INSTALL DATE\`, \`SUPPLIED BY\`, \`SUPPLY ORDER NO\`, \`ASSET ID\`,
        \`MAKE\`, \`MODEL\`, \`SERIAL NO\`, \`LOCATION\`, \`DEP\`, \`REMARKS\`, \`ITEM\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(insertSql, [
      installDate, suppliedBy, supplyOrderNo, assetId,
      make, model, serialNumber, location, department, remarks, item
    ], (insertErr) => {
      if (insertErr) return res.status(500).json({ error: 'Insert failed' });
      res.status(200).json({ message: '✅ Product added successfully!' });
    });
  });
});

// INSERT old item
app.post('/api/old-item', (req, res) => {
  const { assetId, make, item, remarks } = req.body;

  const checkSql = 'SELECT * FROM `project details` WHERE `ASSET ID` = ?';
  db.query(checkSql, [assetId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length > 0) {
      return res.status(400).json({ error: '❌ Asset ID already exists!' });
    }

    const insertSql = `
      INSERT INTO \`project details\` (\`ASSET ID\`, \`MAKE\`, \`ITEM\`, \`REMARKS\`)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertSql, [assetId, make, item, remarks], (err) => {
      if (err) return res.status(500).json({ error: 'Insert error' });
      res.status(200).json({ message: '✅ Old item inserted successfully!' });
    });
  });
});

// OUT item
app.post('/api/out-item', (req, res) => {
  const { assetId } = req.body;

  const sql = 'DELETE FROM `project details` WHERE `ASSET ID` = ?';
  db.query(sql, [assetId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete item' });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '❌ No item found with provided Asset ID' });
    }

    res.status(200).json({ message: '✅ Item deleted successfully!' });
  });
});

// UPDATE product
app.put('/api/update-product', (req, res) => {
  const {
    installDate, suppliedBy, supplyOrderNo, assetId,
    make, model, serialNumber, location, department,
    remarks, item, originalAssetId
  } = req.body;

  const sql = `
    UPDATE \`project details\` SET 
      \`INSTALL DATE\` = ?, 
      \`SUPPLIED BY\` = ?, 
      \`SUPPLY ORDER NO\` = ?, 
      \`ASSET ID\` = ?, 
      \`MAKE\` = ?, 
      \`MODEL\` = ?, 
      \`SERIAL NO\` = ?, 
      \`LOCATION\` = ?, 
      \`DEP\` = ?, 
      \`REMARKS\` = ?, 
      \`ITEM\` = ?
    WHERE \`ASSET ID\` = ?
  `;
  db.query(sql, [
    installDate, suppliedBy, supplyOrderNo, assetId,
    make, model, serialNumber, location, department,
    remarks, item, originalAssetId
  ], (err, result) => {
    if (err) return res.status(500).json({ error: 'Update failed' });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Asset ID not found' });
    }

    res.status(200).json({ message: '✅ Product updated successfully!' });
  });
});

// USER LOGIN

app.post('/api/login-test', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM user_info_1 WHERE username = ? AND password = ?';
  
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length > 0) {
      res.status(200).json({ message: '✅ Login successful' });
    } else {
      res.status(401).json({ message: '❌ Invalid username or password' });
    }
  });
});

// FORGOT PASSWORD
app.post('/api/forgot-password', (req, res) => {
  const { username, newPassword } = req.body;

  const sql = 'UPDATE user_info_1 SET password = ? WHERE username = ?';

  db.query(sql, [newPassword, username], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '❌ User not found' });
    } else {
      res.status(200).json({ message: '✅ Password updated successfully' });
    }
  });
});

// CHANGE USERNAME
app.post('/api/change-username', (req, res) => {
  const { oldUsername, newUsername } = req.body;

  const sql = 'UPDATE user_info_1 SET username = ? WHERE username = ?';

  db.query(sql, [newUsername, oldUsername], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '❌ Old username not found' });
    } else {
      res.status(200).json({ message: '✅ Username updated successfully' });



    }
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM `project details`', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});
app.get('/api/user123', (req, res) => {
  db.query('SELECT * FROM user_info_1', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Set up your PORT from env
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

