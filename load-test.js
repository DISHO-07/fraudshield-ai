
// ═══════════════════════════════════════════════════════
// FraudShield AI — Scalability & Load Test
// Simulates 50 concurrent users to test system stability
// ═══════════════════════════════════════════════════════

const BASE = "http://127.0.0.1:3000";
const CONCURRENT_USERS = 50;

async function simulateUser(userId) {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}/api/transactions/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.random() * 50000,
        payee: "LoadTest_User_" + userId,
        payeeKnown: Math.random() > 0.5,
        hour: Math.floor(Math.random() * 24),
        knownDevice: Math.random() > 0.5,
        location: "Mumbai"
      })
    });
    const latency = performance.now() - t0;
    return { success: res.ok, latency };
  } catch (e) {
    return { success: false, latency: performance.now() - t0 };
  }
}

async function runLoadTest() {
  console.log(`\n🚀 Starting Load Test: ${CONCURRENT_USERS} concurrent requests...\n`);
  const t0 = performance.now();
  
  const promises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(simulateUser(i));
  }
  
  const results = await Promise.all(promises);
  const totalTime = performance.now() - t0;
  
  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;
  const latencies = results.map(r => r.latency);
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
  const maxLatency = Math.max(...latencies).toFixed(1);

  console.log("═══════════════════════════════════════");
  console.log("   LOAD TEST RESULTS (Scalability)");
  console.log("═══════════════════════════════════════");
  console.log(`Total Requests:      ${CONCURRENT_USERS}`);
  console.log(`Successful:          ${successes} ✅`);
  console.log(`Failed:              ${failures} ❌`);
  console.log(`Total Time:          ${totalTime.toFixed(0)}ms`);
  console.log(`Avg Latency:         ${avgLatency}ms`);
  console.log(`Max Latency:         ${maxLatency}ms`);
  console.log(`Throughput:          ${(CONCURRENT_USERS / (totalTime / 1000)).toFixed(1)} req/sec`);
  console.log("═══════════════════════════════════════");
  
  if (failures === 0 && avgLatency < 200) {
    console.log("\n🏆 SYSTEM PASSED: Highly scalable and stable under load!");
  } else {
    console.log("\n⚠️ SYSTEM REVIEW: Some requests failed or were slow.");
  }
}

runLoadTest();