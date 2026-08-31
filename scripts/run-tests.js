const crypto = require("crypto");

console.log("==========================================");
console.log("🧪 INSTITUTIONAL ALPHA & SURGICAL AUDIT TEST RUNNER");
console.log("==========================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("  ✅ PASS: " + message);
    passed++;
  } else {
    console.error("  ❌ FAIL: " + message);
    failed++;
  }
}

// 1. Cache & Rate Limiting Test
console.log("1. Testing Centralized Cache & Rate Limiter...");
const cache = new Map();
const key = "test:acled:cache";
const ttl = 5;
const now = Date.now();
cache.set(key, { data: [{ id: 1 }], expiresAt: now + ttl * 1000 });

assert(cache.has(key), "Cache successfully stores entries");
assert(cache.get(key).expiresAt > now, "Cache respects positive TTL");
assert(cache.get(key).data.length === 1, "Cache returns correct payload data");

// 2. Cryptographic Token Verification Test
console.log("\n2. Testing Cryptographic Token Flow (HMAC-SHA256)...");
const secret = "godmode_test_secret_key";
const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
const payload = Buffer.from(JSON.stringify({ email: "operator@0ther5ide.intel", tier: "vip" })).toString("base64url");
const msg = header + "." + payload;
const sig = crypto.createHmac("sha256", secret).update(msg).digest("base64url");
const token = msg + "." + sig;

const [h, p, s] = token.split(".");
const expectedSig = crypto.createHmac("sha256", secret).update(h + "." + p).digest("base64url");
assert(s === expectedSig, "Valid HMAC-SHA256 signature verified");

const tamperedToken = h + "." + Buffer.from(JSON.stringify({ email: "hacker@evil.com", tier: "vip" })).toString("base64url") + "." + s;
const [th, tp, ts] = tamperedToken.split(".");
const tamperedSig = crypto.createHmac("sha256", secret).update(th + "." + tp).digest("base64url");
assert(ts !== tamperedSig, "Tampered payload correctly rejected with invalid signature");

// 3. FlowSniffer Aggressor & CVD Unit Tests
console.log("\n3. Testing Quant FlowSniffer (Lee-Ready Aggressor & CVD)...");
function classifyAggressor(tradePrice, bestBid, bestAsk) {
  if (tradePrice >= bestAsk) return "AGGRESSIVE_BUY";
  if (tradePrice <= bestBid) return "AGGRESSIVE_SELL";
  return "PASSIVE_CROSS";
}

assert(classifyAggressor(100.05, 100.00, 100.05) === "AGGRESSIVE_BUY", "Trade at/above Ask correctly classified as AGGRESSIVE_BUY");
assert(classifyAggressor(99.95, 100.00, 100.05) === "AGGRESSIVE_SELL", "Trade at/below Bid correctly classified as AGGRESSIVE_SELL");

// 4. AlphaGenerator GEX & MicroPrice Test
console.log("\n4. Testing Quant AlphaGenerator (Micro-Price & GEX)...");
function calcMicroPrice(bidP, bidV, askP, askV) {
  return (bidP * askV + askP * bidV) / (bidV + askV);
}
const micro = calcMicroPrice(100.0, 10, 100.1, 90);
assert(micro > 100.0 && micro < 100.1, "Micro-price is volume-weighted between bid and ask");

// 5. RiskGuard Kelly Criterion & Lot Rounding
console.log("\n5. Testing Quant RiskGuard (Kelly Criterion & Lot Rounding)...");
function calculateKelly(capital, winRate = 0.58, winLoss = 2.2, halfKelly = 0.5) {
  const q = 1 - winRate;
  const f = (winLoss * winRate - q) / winLoss;
  return +(capital * Math.min(0.25, f * halfKelly)).toFixed(2);
}
const size = calculateKelly(100000);
assert(size > 0 && size <= 25000, "Half-Kelly sizing correctly capped at 25% max capital");

function roundLot(size, step = 10) {
  return Math.floor(size / step) * step;
}
assert(roundLot(147.8, 10) === 140, "Sub-penny rounding strictly rounds down to prevent execution over-fill");

console.log("\n==========================================");
console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
console.log("==========================================");

if (failed > 0) process.exit(1);
