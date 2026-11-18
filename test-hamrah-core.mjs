/**
 * Automated tests for HamrahCore (Step 1 integration)
 * Run: node test-hamrah-core.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock localStorage
const memory = new Map();
const localStorage = {
  getItem(k) { return memory.has(k) ? memory.get(k) : null; },
  setItem(k, v) { memory.set(k, String(v)); },
  removeItem(k) { memory.delete(k); },
  clear() { memory.clear(); },
  key(i) { return [...memory.keys()][i] ?? null; },
  get length() { return memory.size; }
};

const sandbox = { window: {}, localStorage, console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const code = fs.readFileSync(path.join(__dirname, "hamrah-core.js"), "utf8");
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const HC = sandbox.HamrahCore;
if (!HC) {
  console.error("FAIL: HamrahCore not defined");
  process.exit(1);
}

let passed = 0;
let failed = 0;
const results = [];

function assert(name, cond, detail) {
  if (cond) {
    passed++;
    results.push({ name, ok: true });
    console.log("  PASS:", name);
  } else {
    failed++;
    results.push({ name, ok: false, detail });
    console.log("  FAIL:", name, detail || "");
  }
}

console.log("\n=== Test A – Initial data ===");
memory.clear();
const load1 = HC.loadStore();
assert("loadStore ok", load1.ok, load1.error);
assert("schema version 1", load1.store.meta.schemaVersion === 1);
const c1 = HC.getCustomerById(load1.store, "cust_1");
assert("cust_1 exists", !!c1);
assert("cust_1 name", c1 && c1.fullName === "آرمان فرهمند");
assert("cust_1 membership", c1 && c1.membershipId === "HM-10245");
assert("biz_1 balance 2450", c1 && c1.balances.biz_1 === 2450);
assert("biz_2 balance 1200", c1 && c1.balances.biz_2 === 1200);
assert("biz_3 balance 850", c1 && c1.balances.biz_3 === 850);
assert("biz_4 balance 3100", c1 && c1.balances.biz_4 === 3100);
assert("biz_5 balance 500", c1 && c1.balances.biz_5 === 500);
assert("7 businesses", load1.store.businesses.length === 7);
assert("Bakeresso business name", HC.getBusinessById(load1.store, "biz_1").name === "کافه بیکری بیکرسو");
assert("Dinur business name", HC.getBusinessById(load1.store, "biz_3").name === "طلافروشی دینور");
assert("Tika fast food exists", !!HC.getBusinessById(load1.store, "biz_6"));
assert("Nushka baklava cafe exists", !!HC.getBusinessById(load1.store, "biz_7"));
assert("5 customers", load1.store.customers.length === 5);

console.log("\n=== Test B – Purchase ===");
let store = load1.store;
const before = HC.getBalance(store, "cust_1", "biz_1");
const purchase = HC.applyTransaction(store, {
  customerId: "cust_1",
  businessId: "biz_1",
  pointsDelta: 25,
  type: "purchase",
  amount: 250000,
  employee: "سارا محمدی",
  employeeId: "emp_cashier_1",
  datetime: "1403/08/20 12:00"
});
assert("purchase ok", purchase.ok, purchase.error);
assert("balance after = before + 25", purchase.balanceAfter === before + 25);
assert("tx recorded", !!purchase.transaction);
assert("tx positive points", purchase.transaction.points === 25);
assert("tx type purchase", purchase.transaction.type === "purchase");
assert("tx has customerId", purchase.transaction.customerId === "cust_1");
assert("tx has businessId", purchase.transaction.businessId === "biz_1");
assert("tx status success", purchase.transaction.status === "success");
assert("tx unique id", !!purchase.transaction.id);
const reloadAfterPurchase = HC.loadStore();
assert("persisted balance", HC.getBalance(reloadAfterPurchase.store, "cust_1", "biz_1") === before + 25);
assert("persisted tx count >= 1", reloadAfterPurchase.store.transactions.length >= 1);

console.log("\n=== Test C – Business isolation ===");
const zBalance = HC.getBalance(reloadAfterPurchase.store, "cust_1", "biz_2");
assert("Soren balance remains isolated at 1200", zBalance === 1200);

console.log("\n=== Test D – Redemption ===");
store = reloadAfterPurchase.store;
const balBeforeRedeem = HC.getBalance(store, "cust_1", "biz_1");
const redeem = HC.applyTransaction(store, {
  customerId: "cust_1",
  businessId: "biz_1",
  pointsDelta: -700,
  type: "redemption",
  rewardId: "rw1a",
  rewardName: "قهوه رایگان",
  employee: "سارا محمدی",
  employeeId: "emp_cashier_1"
});
assert("redeem ok", redeem.ok, redeem.error);
assert("balance decreased by 700", redeem.balanceAfter === balBeforeRedeem - 700);
assert("tx negative points", redeem.transaction.points === -700);
assert("tx type redemption", redeem.transaction.type === "redemption");

console.log("\n=== Test E – Insufficient balance ===");
store = HC.loadStore().store;
const balNow = HC.getBalance(store, "cust_1", "biz_1");
const bad = HC.applyTransaction(store, {
  customerId: "cust_1",
  businessId: "biz_1",
  pointsDelta: -(balNow + 1000),
  type: "redemption",
  rewardName: "too expensive"
});
assert("blocked", !bad.ok);
assert("balance unchanged", HC.getBalance(HC.loadStore().store, "cust_1", "biz_1") === balNow);

console.log("\n=== Test F – Persistence ===");
const mid = HC.loadStore().store;
const midBal = HC.getBalance(mid, "cust_1", "biz_1");
const midTx = mid.transactions.length;
// Simulate "refresh" by loading again without clear
const again = HC.loadStore().store;
assert("balance persists", HC.getBalance(again, "cust_1", "biz_1") === midBal);
assert("tx count persists", again.transactions.length === midTx);

console.log("\n=== Test G – Migration ===");
memory.clear();
// Seed old employee key
const oldPayload = {
  customers: [
    {
      id: "cust_1",
      fullName: "آرمان فرهمند",
      phone: "09123456789",
      membershipId: "HM-10245",
      status: "active",
      balances: { biz_1: 9999, biz_2: 1200, biz_3: 850, biz_4: 3100, biz_5: 500 },
      leagues: { biz_1: "طلایی", biz_2: "نقره‌ای", biz_3: "برنزی", biz_4: "طلایی", biz_5: "برنزی" }
    }
  ],
  transactions: [
    {
      id: "TX-OLD-1",
      customerId: "cust_1",
      customerName: "آرمان فرهمند",
      businessId: "biz_1",
      type: "purchase",
      amount: 100000,
      points: 10,
      balanceAfter: 9999,
      employee: "سارا محمدی",
      datetime: "1403/01/01 10:00",
      status: "success"
    }
  ],
  selectedBizId: "biz_1"
};
localStorage.setItem(HC.OLD_EMPLOYEE_KEY, JSON.stringify(oldPayload));
const mig = HC.loadStore();
assert("migration load ok", mig.ok, mig.error);
assert("migrated flag", mig.migrated === true);
assert("migrated balance 9999", HC.getBalance(mig.store, "cust_1", "biz_1") === 9999);
assert("migrated tx present", mig.store.transactions.some(t => t.id === "TX-OLD-1"));
// Second load should NOT re-migrate / duplicate
const mig2 = HC.loadStore();
assert("no re-migrate", mig2.migrated === false);
const txOldCount = mig2.store.transactions.filter(t => t.id === "TX-OLD-1").length;
assert("no duplicate TX-OLD-1", txOldCount === 1);

console.log("\n=== Test H – Reset ===");
const reset = HC.resetDemoData();
assert("reset ok", reset.ok, reset.error);
assert("balance back to 2450", HC.getBalance(reset.store, "cust_1", "biz_1") === 2450);
assert("transactions empty", reset.store.transactions.length === 0);
assert("unrelated keys kept", localStorage.getItem(HC.OLD_EMPLOYEE_KEY) !== null);

console.log("\n=== Summary ===");
console.log("Passed:", passed);
console.log("Failed:", failed);
if (failed > 0) process.exit(1);
console.log("All tests passed.");
