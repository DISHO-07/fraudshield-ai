
// database.js - Handles all database operations
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'fraudshield.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeTables();
  }
});

// Create tables if they don't exist
function initializeTables() {
  db.serialize(() => {
    // Transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT UNIQUE,
        amount REAL NOT NULL,
        payee TEXT,
        payeeKnown INTEGER DEFAULT 0,
        hour INTEGER,
        knownDevice INTEGER DEFAULT 0,
        location TEXT,
        mcc TEXT,
        ip TEXT,
        fingerprint TEXT,
        riskScore INTEGER DEFAULT 0,
        riskLevel TEXT DEFAULT 'LOW',
        mlScore INTEGER DEFAULT 0,
        ruleScore INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PENDING',
        reasons TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit log table
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        detail TEXT,
        tag TEXT DEFAULT 'info',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables ready');
  });
}

// Save a transaction
function saveTransaction(tx, callback) {
  const sql = `
    INSERT INTO transactions 
    (reference, amount, payee, payeeKnown, hour, knownDevice, location, mcc, ip, fingerprint, riskScore, riskLevel, mlScore, ruleScore, status, reasons)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    tx.reference, tx.amount, tx.payee, tx.payeeKnown ? 1 : 0,
    tx.hour, tx.knownDevice ? 1 : 0, tx.location, tx.mcc,
    tx.ip, tx.fingerprint, tx.riskScore, tx.riskLevel,
    tx.mlScore, tx.ruleScore, tx.status, JSON.stringify(tx.reasons)
  ], function(err) {
    if (err) {
      console.error('❌ Error saving transaction:', err.message);
      callback(err, null);
    } else {
      callback(null, this.lastID);
    }
  });
}

// Get all transactions
function getAllTransactions(callback) {
  db.all('SELECT * FROM transactions ORDER BY createdAt DESC LIMIT 50', [], (err, rows) => {
    if (err) {
      callback(err, []);
    } else {
      callback(null, rows);
    }
  });
}

// Get transaction by ID
function getTransactionById(id, callback) {
  db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
    callback(err, row);
  });
}

// Update transaction status
function updateTransactionStatus(id, status, callback) {
  db.run('UPDATE transactions SET status = ? WHERE id = ?', [status, id], function(err) {
    callback(err);
  });
}

// Save audit log entry
function saveAuditLog(action, detail, tag) {
  db.run(
    'INSERT INTO audit_log (action, detail, tag) VALUES (?, ?, ?)',
    [action, detail, tag]
  );
}

// Get audit logs
function getAuditLogs(callback) {
  db.all('SELECT * FROM audit_log ORDER BY createdAt DESC LIMIT 100', [], (err, rows) => {
    callback(err, rows);
  });
}

// Get statistics
function getStats(callback) {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM transactions', (err, row) => {
    stats.totalTransactions = row ? row.total : 0;
    
    db.get("SELECT COUNT(*) as blocked FROM transactions WHERE riskLevel IN ('HIGH', 'CRITICAL')", (err, row) => {
      stats.blockedTransactions = row ? row.blocked : 0;
      
      db.get("SELECT COALESCE(SUM(amount), 0) as saved FROM transactions WHERE riskLevel IN ('HIGH', 'CRITICAL')", (err, row) => {
        stats.amountProtected = row ? row.saved : 0;
        callback(null, stats);
      });
    });
  });
}

// Export all functions
module.exports = {
  saveTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  saveAuditLog,
  getAuditLogs,
  getStats
};