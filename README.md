# 🛡️ FraudShield AI — Enterprise Fraud Intelligence

> Real-time, **pre-transaction** fraud detection combining explainable rules,
> ML anomaly detection, and biometric step-up eKYC.

---

## 🎯 Problem
Digital fraud is usually detected *after* money leaves the account, making
recovery nearly impossible. FraudShield stops fraud **before** the transaction
completes, without interfering with core banking systems.

## ✨ Features
- **Hybrid Risk Engine** — Rules + Isolation Forest anomaly detection
- **Explainable AI** — every alert lists contributing factors
- **Biometric Step-Up eKYC** — webcam face scan for high-risk transactions
- **Live Geographic Heatmap** — real-time fraud locations
- **Investigation Hub** — case management for fraud analysts
- **PDF Incident Reports** + full audit trail
- **OTP & eKYC verification flows**

## 🏗️ Architecture

```mermaid
graph TD
    A[User / Payment Gateway] -->|Transaction Data| B(FraudShield API)
    B --> C{Risk Engine}
    C -->|Rules| D[Rule Engine]
    C -->|Anomaly| E[Isolation Forest ML]
    D --> F[Decision Engine]
    E --> F
    F -->|Low Risk| G[✅ Approve]
    F -->|Med Risk| H[🔐 Request OTP]
    F -->|High Risk| I[📸 Request eKYC]
    F -->|Critical| J[⛔ Block & Alert]
    G --> K((Bank / PSP))
    H --> K
    I --> K


```markdown
## 📡 API Documentation

### `POST /api/transactions/initiate`
Analyzes a transaction and returns a risk score.

**Request Body:**
```json
{
  "amount": 49999,
  "payee": "unknown_upi_9x2k",
  "payeeKnown": false,
  "hour": 3,
  "knownDevice": false,
  "location": "Delhi"
}
 