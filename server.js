
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Normal user behavior profile
const USUAL_PROFILE = {
  averageAmount: 1000,
  startHour: 8,
  endHour: 22,
  location: "Mumbai",
  deviceId: "device_123"
};

let transactions = [];

// ==========================================
// 1. RULE-BASED ENGINE (Explainable AI)
// ==========================================
function calculateRuleScore(t) {
  let score = 0;
  const reasons = [];

  if (t.amount > USUAL_PROFILE.averageAmount * 5) { score += 30; reasons.push("Amount is 5x higher than usual"); }
  if (t.amount > USUAL_PROFILE.averageAmount * 10) { score += 10; reasons.push("Extremely high amount"); }
  if (!t.payeeKnown) { score += 20; reasons.push("Payee is new/untrusted"); }
  if (t.amount > 5000 && !t.payeeKnown) { score += 10; reasons.push("High amount to new payee"); }
  if (t.hour < USUAL_PROFILE.startHour || t.hour > USUAL_PROFILE.endHour) { score += 15; reasons.push("Unusual transaction time"); }
  if (!t.knownDevice) { score += 20; reasons.push("Unrecognized device"); }
  if (t.location !== USUAL_PROFILE.location) { score += 15; reasons.push("Location mismatch"); }

  return { score: Math.min(100, score), reasons };
}

// ==========================================
// 2. ISOLATION FOREST ML SIMULATION (Black Box AI)
// ==========================================
// Mimics how Isolation Forest finds multi-dimensional outliers
function getMLAnomalyScore(t) {
  let anomaly = 0;
  
  // ML catches combinations that simple rules miss
  if (t.amount > 10000 && (t.hour < 6 || t.hour > 23)) anomaly += 45; // Night + High Amount
  if (!t.knownDevice && !t.payeeKnown) anomaly += 35; // New Device + New Payee
  if (t.location !== USUAL_PROFILE.location && t.amount > 5000) anomaly += 25; // Travel + High Amount
  
  // Add slight variance to simulate ML confidence levels
  anomaly += Math.random() * 15; 
  
  return Math.min(100, Math.round(anomaly));
}

// ==========================================
// 3. FINAL DECISION ENGINE
// ==========================================
function calculateFinalRisk(t) {
  const ruleResult = calculateRuleScore(t);
  const mlScore = getMLAnomalyScore(t);
  
  // Hybrid Score: 60% Rules (Explainable) + 40% ML (Anomaly)
  const finalScore = Math.round((ruleResult.score * 0.6) + (mlScore * 0.4));

  let riskLevel, action;
  if (finalScore <= 30) { riskLevel = "LOW"; action = "APPROVE"; } 
  else if (finalScore <= 60) { riskLevel = "MEDIUM"; action = "OTP_REQUIRED"; } 
  else { 
    riskLevel = finalScore > 85 ? "CRITICAL" : "HIGH"; 
    action = "EKYC_REQUIRED";
  }

  return {
    riskScore: finalScore,
    mlScore: mlScore,
    ruleScore: ruleResult.score,
    riskLevel,
    action,
    reasons: ruleResult.reasons
  };
}

// ==========================================
// API ENDPOINTS
// ==========================================
app.get("/api/transactions", (req, res) => res.json(transactions));

app.post("/api/transactions/initiate", (req, res) => {
  const now = new Date();
  const transaction = {
    id: Date.now(),
    amount: Number(req.body.amount || 0),
    payee: String(req.body.payee || "Unknown"),
    payeeKnown: Boolean(req.body.payeeKnown),
    hour: Number(req.body.hour ?? now.getHours()),
    knownDevice: Boolean(req.body.knownDevice),
    location: String(req.body.location || "Delhi"),
    createdAt: now.toISOString()
  };

  const risk = calculateFinalRisk(transaction);
  
  Object.assign(transaction, risk);
  transaction.status = risk.action;
  transactions.unshift(transaction);

  res.json({ transaction, risk });
});

app.post("/api/transactions/:id/verify", (req, res) => {
  const id = Number(req.params.id);
  const transaction = transactions.find(item => item.id === id);
  if (!transaction) return res.status(404).json({ error: "Not found" });

  const success = Boolean(req.body.success);
  const type = req.body.verificationType;

  if (success) {
    transaction.status = "APPROVED";
    transaction.verificationStatus = `${type}_SUCCESS`;
  } else {
    transaction.status = "BLOCKED";
    transaction.verificationStatus = `${type}_FAILED`;
  }
  res.json(transaction);
});

app.listen(3000, () => console.log("FraudShield AI running at http://localhost:3000"));
// Health check endpoint for monitoring
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime_seconds: Math.floor(process.uptime()),
    transactions_processed: transactions.length,
    timestamp: new Date().toISOString()
  });
});

app.listen(3000, () => {
  console.log("FraudShield AI running at http://localhost:3000");
});