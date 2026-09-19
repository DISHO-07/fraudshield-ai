// ═══════════════════════════════════════════════════════
// FraudShield AI — Validation Suite
// Run with: node test.js  (make sure server is running)
// ═══════════════════════════════════════════════════════

const BASE = "http://127.0.0.1:4000";

// Test scenarios covering all risk levels
const scenarios = [
  {
    name: "Normal — Coffee",
    data: { amount: 349, payee: "Starbucks", payeeKnown: true, hour: 10, knownDevice: true, location: "Mumbai" },
    expect: ["LOW"]
  },
  {
    name: "Normal — Grocery",
    data: { amount: 850, payee: "BigBazaar", payeeKnown: true, hour: 17, knownDevice: true, location: "Mumbai" },
    expect: ["LOW"]
  },
  {
    name: "Medium — New payee",
    data: { amount: 12000, payee: "NewFriend", payeeKnown: false, hour: 18, knownDevice: true, location: "Mumbai" },
    expect: ["MEDIUM", "HIGH"]
  },
  {
    name: "High — Night + device",
    data: { amount: 20000, payee: "Unknown", payeeKnown: false, hour: 3, knownDevice: false, location: "Mumbai" },
    expect: ["HIGH", "CRITICAL"]
  },
  {
    name: "Critical — Full fraud",
    data: { amount: 49999, payee: "Unknown", payeeKnown: false, hour: 3, knownDevice: false, location: "Delhi" },
    expect: ["CRITICAL"]
  }
];

async function run() {
  console.log("\n═══════════════════════════════════════");
  console.log("   FraudShield AI — Validation Suite");
  console.log("═══════════════════════════════════════\n");

  // Step 1: Check if server is healthy
  try {
    const h = await fetch(BASE + "/health");
    const hj = await h.json();
    console.log(`✅ Server healthy`);
    console.log(`   Uptime: ${hj.uptime_seconds}s | Version: ${hj.version}\n`);
  } catch (e) {
    console.error("❌ Server not reachable!");
    console.error("   Start it first with:  node server.js\n");
    process.exit(1);
  }

  let pass = 0;
  const latencies = [];

  // Step 2: Run each test scenario
  for (const s of scenarios) {
    const t0 = performance.now();
    try {
      const res = await fetch(BASE + "/api/transactions/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s.data)
      });
      const latency = performance.now() - t0;
      latencies.push(latency);

      const json = await res.json();
      const got = json.risk.riskLevel;
      const ok = s.expect.includes(got);
      if (ok) pass++;

      const icon = ok ? "✅" : "❌";
      console.log(`${icon} ${s.name.padEnd(24)} expect=${s.expect.join("|").padEnd(16)} got=${got.padEnd(9)} score=${json.risk.riskScore}  ${latency.toFixed(1)}ms`);
    } catch (err) {
      console.log(`❌ ${s.name.padEnd(24)} ERROR: ${err.message}`);
    }
  }

  // Step 3: Calculate results
  const accuracy = (pass / scenarios.length * 100).toFixed(0);
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
  const maxLatency = Math.max(...latencies).toFixed(1);

  console.log("\n═══════════════════════════════════════");
  console.log("   RESULTS");
  console.log("═══════════════════════════════════════");
  console.log(`Detection accuracy:   ${pass}/${scenarios.length}  (${accuracy}%)`);
  console.log(`Avg response time:    ${avgLatency}ms`);
  console.log(`Max response time:    ${maxLatency}ms`);
  console.log(`Reliability check:    ${avgLatency < 100 ? "PASS (<100ms) ✅" : "REVIEW ⚠️"}`);
  console.log("═══════════════════════════════════════\n");

  if (accuracy === "100") {
    console.log("🏆 All risk tiers classified correctly!");
  } else {
    console.log("⚠️  Some cases need tuning. Review the failed tests above.");
  }
}

run().catch(e => {
  console.error("❌ Unexpected error:", e.message);
});