/**
 * Hamrah Loyalty Platform – Shared Core (v1)
 * Provides a single localStorage-backed store for customers, balances,
 * transactions, and related demo data. Used by the Employee interface
 * in this milestone; other interfaces will connect later.
 *
 * Usage: load via <script src="hamrah-core.js"></script>
 * Global: window.HamrahCore
 */
(function (global) {
  "use strict";

  var STORE_KEY = "hamrah_v1_store";
  var OLD_EMPLOYEE_KEY = "hamrah_employee_demo_v1";
  var BACKUP_PREFIX = "hamrah_v1_backup_";
  var SCHEMA_VERSION = 1;

  /* ------------------------------------------------------------------ */
  /* Canonical seed data                                                */
  /* ------------------------------------------------------------------ */

  var SEED_BUSINESSES = [
    { id: "biz_1", name: "کافه بیکری بیکرسو", category: "کافه و رستوران", status: "active" },
    { id: "biz_2", name: "رستوران سورن", category: "کافه و رستوران", status: "active" },
    { id: "biz_3", name: "طلافروشی دینور", category: "زیورآلات", status: "active" },
    { id: "biz_4", name: "صرافی آراکس", category: "صرافی", status: "active" },
    { id: "biz_5", name: "گلخانه رویا", category: "گل و گیاه", status: "active" },
    { id: "biz_6", name: "فست‌فود تیکا", category: "فست‌فود", status: "active" },
    { id: "biz_7", name: "کافه باقلوا نوشکا", category: "کافه و شیرینی", status: "active" }
  ];

  var SEED_CUSTOMERS = [
    {
      id: "cust_1",
      fullName: "آرمان فرهمند",
      phone: "09123456789",
      membershipId: "HM-10245",
      status: "active",
      regDate: "1403/02/15",
      balances: { biz_1: 2450, biz_2: 1200, biz_3: 850, biz_4: 3100, biz_5: 500, biz_6: 0, biz_7: 0 },
      leagues: { biz_1: "طلایی", biz_2: "نقره‌ای", biz_3: "برنزی", biz_4: "طلایی", biz_5: "برنزی", biz_6: "برنزی", biz_7: "برنزی" }
    },
    {
      id: "cust_2",
      fullName: "سارا محمدی",
      phone: "09121112233",
      membershipId: "HM-10246",
      status: "active",
      regDate: "1403/03/01",
      balances: { biz_1: 800, biz_2: 3400, biz_3: 200, biz_4: 1500, biz_5: 0, biz_6: 0, biz_7: 0 },
      leagues: { biz_1: "نقره‌ای", biz_2: "طلایی", biz_3: "برنزی", biz_4: "نقره‌ای", biz_5: "برنزی", biz_6: "برنزی", biz_7: "برنزی" }
    },
    {
      id: "cust_3",
      fullName: "علی کریمی",
      phone: "09125556677",
      membershipId: "HM-10247",
      status: "active",
      regDate: "1402/11/20",
      balances: { biz_1: 5200, biz_2: 900, biz_3: 4100, biz_4: 800, biz_5: 1200, biz_6: 0, biz_7: 0 },
      leagues: { biz_1: "ویژه", biz_2: "نقره‌ای", biz_3: "طلایی", biz_4: "نقره‌ای", biz_5: "نقره‌ای", biz_6: "برنزی", biz_7: "برنزی" }
    },
    {
      id: "cust_4",
      fullName: "نازنین احمدی",
      phone: "09128889900",
      membershipId: "HM-10248",
      status: "active",
      regDate: "1403/05/10",
      balances: { biz_1: 350, biz_2: 150, biz_3: 0, biz_4: 600, biz_5: 2800, biz_6: 0, biz_7: 0 },
      leagues: { biz_1: "برنزی", biz_2: "برنزی", biz_3: "برنزی", biz_4: "برنزی", biz_5: "طلایی", biz_6: "برنزی", biz_7: "برنزی" }
    },
    {
      id: "cust_5",
      fullName: "مهدی حسینی",
      phone: "09123334455",
      membershipId: "HM-10249",
      status: "inactive",
      regDate: "1402/08/05",
      balances: { biz_1: 100, biz_2: 50, biz_3: 0, biz_4: 0, biz_5: 0, biz_6: 0, biz_7: 0 },
      leagues: { biz_1: "برنزی", biz_2: "برنزی", biz_3: "برنزی", biz_4: "برنزی", biz_5: "برنزی", biz_6: "برنزی", biz_7: "برنزی" }
    }
  ];

  var SEED_EMPLOYEES = [
    {
      id: "emp_cashier_1",
      name: "سارا محمدی",
      phone: "09120001122",
      businessId: "biz_1",
      branch: "شعبه ولیعصر",
      role: "صندوق‌دار",
      status: "active"
    }
  ];

  var SEED_REWARDS = [
    { id: "rw1a", name: "قهوه رایگان", desc: "یک فنجان قهوه تخصصی", businessIds: ["biz_1"], cost: 700, status: "active", quantity: 200 },
    { id: "rw1b", name: "تخفیف ۵٪", desc: "تخفیف روی فاکتور بعدی", businessIds: ["biz_1"], cost: 500, status: "active", quantity: 500 },
    { id: "rw1c", name: "دسر رایگان", desc: "یک قلم دسر روز", businessIds: ["biz_1"], cost: 900, status: "active", quantity: 100 },
    { id: "rw1d", name: "هدیه ویژه", desc: "پکیج ویژه کافه", businessIds: ["biz_1"], cost: 2000, status: "active", quantity: 50 },
    { id: "rw2a", name: "تخفیف ۱۰٪", desc: "تخفیف روی فاکتور", businessIds: ["biz_2"], cost: 1000, status: "active", quantity: 300 },
    { id: "rw2b", name: "نوشیدنی رایگان", desc: "یک نوشیدنی همراه غذا", businessIds: ["biz_2"], cost: 600, status: "active", quantity: 200 },
    { id: "rw2c", name: "پیش‌غذا رایگان", desc: "یک پیش‌غذای روز", businessIds: ["biz_2"], cost: 1200, status: "active", quantity: 80 },
    { id: "rw3a", name: "تخفیف ۵٪ زیورآلات", desc: "تخفیف روی خرید بعدی", businessIds: ["biz_3"], cost: 1500, status: "active", quantity: 100 },
    { id: "rw3b", name: "پاکسازی رایگان", desc: "سرویس پاکسازی جواهر", businessIds: ["biz_3"], cost: 800, status: "active", quantity: 50 },
    { id: "rw3c", name: "هدیه ویژه طلافروشی دینور", desc: "هدیه خاص فروشگاه", businessIds: ["biz_3"], cost: 3000, status: "active", quantity: 20 },
    { id: "rw4a", name: "تخفیف کارمزد", desc: "کاهش کارمزد معامله", businessIds: ["biz_4"], cost: 1000, status: "active", quantity: 100 },
    { id: "rw4b", name: "اولویت نوبت", desc: "نوبت ویژه بدون صف", businessIds: ["biz_4"], cost: 500, status: "active", quantity: 200 },
    { id: "rw5a", name: "گل رایگان", desc: "یک شاخه گل فصلی", businessIds: ["biz_5"], cost: 600, status: "active", quantity: 150 },
    { id: "rw5b", name: "تخفیف ۱۵٪", desc: "تخفیف روی خرید گیاه", businessIds: ["biz_5"], cost: 900, status: "active", quantity: 100 },
    { id: "rw5c", name: "خاک و کود رایگان", desc: "بسته مراقبت گیاه", businessIds: ["biz_5"], cost: 400, status: "active", quantity: 120 },
    { id: "rw6a", name: "سیب‌زمینی رایگان", desc: "یک پرس سیب‌زمینی", businessIds: ["biz_6"], cost: 600, status: "active", quantity: 100 },
    { id: "rw7a", name: "باقلوا رایگان", desc: "یک قطعه باقلوای ویژه", businessIds: ["biz_7"], cost: 500, status: "active", quantity: 100 }
  ];

  var SEED_SETTINGS = {
    platformName: "رادوان همراه",
    currency: "تومان",
    pointsExpiryDays: 365,
    conflictPolicy: "all"
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function nowIso() {
    return new Date().toISOString();
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function createEmptyStore() {
    return {
      meta: { schemaVersion: SCHEMA_VERSION, updatedAt: nowIso() },
      businesses: deepClone(SEED_BUSINESSES),
      customers: deepClone(SEED_CUSTOMERS),
      employees: deepClone(SEED_EMPLOYEES),
      leagues: {},
      rules: [],
      rewards: deepClone(SEED_REWARDS),
      offers: [],
      transactions: [],
      settings: deepClone(SEED_SETTINGS)
    };
  }

  function isValidStore(data) {
    if (!data || typeof data !== "object") return false;
    if (!data.meta || typeof data.meta.schemaVersion !== "number") return false;
    if (!Array.isArray(data.customers)) return false;
    if (!Array.isArray(data.businesses)) return false;
    if (!Array.isArray(data.transactions)) return false;
    // Spot-check customer shape
    if (data.customers.length) {
      var c = data.customers[0];
      if (!c.id || !c.balances || typeof c.balances !== "object") return false;
    }
    return true;
  }

  function readRaw(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeRaw(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function backupKey() {
    return BACKUP_PREFIX + Date.now();
  }

  /* ------------------------------------------------------------------ */
  /* Migration from old Employee key                                    */
  /* ------------------------------------------------------------------ */

  function migrateFromEmployeeV1(oldData, baseStore) {
    if (!oldData || typeof oldData !== "object") return baseStore;

    var store = deepClone(baseStore);

    // Merge customers by id – prefer old balances/leagues if present
    if (Array.isArray(oldData.customers) && oldData.customers.length) {
      var byId = {};
      store.customers.forEach(function (c) { byId[c.id] = c; });
      oldData.customers.forEach(function (oc) {
        if (!oc || !oc.id) return;
        if (byId[oc.id]) {
          // Update balances/leagues from migrated data
          if (oc.balances && typeof oc.balances === "object") {
            byId[oc.id].balances = Object.assign({}, byId[oc.id].balances, oc.balances);
          }
          if (oc.leagues && typeof oc.leagues === "object") {
            byId[oc.id].leagues = Object.assign({}, byId[oc.id].leagues, oc.leagues);
          }
          if (oc.status) byId[oc.id].status = oc.status;
        } else {
          // Unknown customer – add if shape looks valid
          if (oc.fullName && oc.balances) {
            store.customers.push(deepClone(oc));
          }
        }
      });
    }

    // Merge transactions – avoid duplicates by id
    if (Array.isArray(oldData.transactions) && oldData.transactions.length) {
      var existingIds = {};
      store.transactions.forEach(function (t) { existingIds[t.id] = true; });
      oldData.transactions.forEach(function (t) {
        if (!t || !t.id) return;
        if (existingIds[t.id]) return;
        // Normalize minimal fields
        var normalized = {
          id: t.id,
          customerId: t.customerId || "",
          customerName: t.customerName || "",
          businessId: t.businessId || "",
          type: t.type || "purchase",
          amount: typeof t.amount === "number" ? t.amount : 0,
          points: typeof t.points === "number" ? t.points : 0,
          balanceAfter: typeof t.balanceAfter === "number" ? t.balanceAfter : 0,
          employeeId: t.employeeId || null,
          employee: t.employee || "",
          datetime: t.datetime || nowIso(),
          status: t.status || "success",
          invoice: t.invoice || "",
          notes: t.notes || "",
          rewardName: t.rewardName || null,
          rewardId: t.rewardId || null
        };
        store.transactions.push(normalized);
        existingIds[t.id] = true;
      });
      // Newest first
      store.transactions.sort(function (a, b) {
        return (b.datetime || "").localeCompare(a.datetime || "");
      });
    }

    store.meta.updatedAt = nowIso();
    store.meta.migratedFrom = OLD_EMPLOYEE_KEY;
    return store;
  }

  /* ------------------------------------------------------------------ */
  /* Core API                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Load the shared store. Initializes or migrates if needed.
   * @returns {{ ok: boolean, store?: object, error?: string, migrated?: boolean }}
   */
  function loadStore() {
    try {
      var existing = readRaw(STORE_KEY);
      if (existing && isValidStore(existing)) {
        // Keep existing customer balances and transactions, but synchronize the canonical business directory.
        var canonical = deepClone(SEED_BUSINESSES);
        var existingById = {};
        (existing.businesses || []).forEach(function (b) { existingById[b.id] = b; });
        existing.businesses = canonical.map(function (b) {
          var prior = existingById[b.id] || {};
          return Object.assign({}, prior, b);
        });
        existing.customers.forEach(function (c) {
          c.balances = c.balances || {};
          c.leagues = c.leagues || {};
          canonical.forEach(function (b) {
            if (typeof c.balances[b.id] !== "number") c.balances[b.id] = 0;
            if (!c.leagues[b.id]) c.leagues[b.id] = "برنزی";
          });
        });
        existing.settings = Object.assign({}, SEED_SETTINGS, existing.settings || {}, { platformName: "رادوان همراه" });
        saveStore(existing);
        return { ok: true, store: existing, migrated: false };
      }

      // Backup corrupted data if present
      if (existing) {
        try {
          writeRaw(backupKey() + "_corrupt", existing);
        } catch (e) { /* ignore */ }
      }

      var store = createEmptyStore();
      var migrated = false;

      // Attempt migration from old Employee key
      var old = readRaw(OLD_EMPLOYEE_KEY);
      if (old) {
        try {
          writeRaw(backupKey() + "_employee_v1", old);
          store = migrateFromEmployeeV1(old, store);
          migrated = true;
        } catch (migErr) {
          // Keep empty seed; do not wipe old key
          return {
            ok: false,
            error: "Migration from " + OLD_EMPLOYEE_KEY + " failed: " + (migErr && migErr.message ? migErr.message : String(migErr)),
            store: createEmptyStore()
          };
        }
      }

      writeRaw(STORE_KEY, store);
      return { ok: true, store: store, migrated: migrated };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  /**
   * Persist the full store. Updates meta.updatedAt.
   * @param {object} store
   * @returns {{ ok: boolean, error?: string }}
   */
  function saveStore(store) {
    try {
      if (!isValidStore(store)) {
        return { ok: false, error: "Invalid store structure; refuse to save." };
      }
      store.meta = store.meta || {};
      store.meta.schemaVersion = SCHEMA_VERSION;
      store.meta.updatedAt = nowIso();
      writeRaw(STORE_KEY, store);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  /**
   * Reset store to canonical seed. Does not delete unrelated keys.
   * @returns {{ ok: boolean, store?: object, error?: string }}
   */
  function resetDemoData() {
    try {
      var current = readRaw(STORE_KEY);
      if (current) {
        try { writeRaw(backupKey() + "_pre_reset", current); } catch (e) { /* ignore */ }
      }
      var store = createEmptyStore();
      writeRaw(STORE_KEY, store);
      return { ok: true, store: store };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  function getCustomerById(store, customerId) {
    if (!store || !Array.isArray(store.customers)) return null;
    for (var i = 0; i < store.customers.length; i++) {
      if (store.customers[i].id === customerId) return store.customers[i];
    }
    return null;
  }

  function getBusinessById(store, businessId) {
    if (!store || !Array.isArray(store.businesses)) return null;
    for (var i = 0; i < store.businesses.length; i++) {
      if (store.businesses[i].id === businessId) return store.businesses[i];
    }
    return null;
  }

  function getBalance(store, customerId, businessId) {
    var c = getCustomerById(store, customerId);
    if (!c || !c.balances) return 0;
    var v = c.balances[businessId];
    return typeof v === "number" ? v : 0;
  }

  function getLeague(store, customerId, businessId) {
    var c = getCustomerById(store, customerId);
    if (!c || !c.leagues) return "برنزی";
    return c.leagues[businessId] || "برنزی";
  }

  /**
   * Apply a balance delta and append a transaction in one save.
   * Fails if resulting balance would be negative (for redemptions).
   *
   * @param {object} store
   * @param {object} opts
   * @param {string} opts.customerId
   * @param {string} opts.businessId
   * @param {number} opts.pointsDelta  positive = earn, negative = redeem
   * @param {string} opts.type  "purchase" | "redemption"
   * @param {number} [opts.amount]
   * @param {string} [opts.employeeId]
   * @param {string} [opts.employee]
   * @param {string} [opts.invoice]
   * @param {string} [opts.notes]
   * @param {string} [opts.rewardId]
   * @param {string} [opts.rewardName]
   * @param {string} [opts.datetime]  display string; optional
   * @returns {{ ok: boolean, transaction?: object, balanceAfter?: number, error?: string }}
   */
  function applyTransaction(store, opts) {
    if (!store || !opts) return { ok: false, error: "Missing store or options." };
    var customerId = opts.customerId;
    var businessId = opts.businessId;
    var pointsDelta = Number(opts.pointsDelta);
    if (!customerId || !businessId || isNaN(pointsDelta)) {
      return { ok: false, error: "customerId, businessId, and pointsDelta are required." };
    }

    var cust = getCustomerById(store, customerId);
    if (!cust) return { ok: false, error: "Customer not found." };
    if (cust.status === "inactive") return { ok: false, error: "Customer is inactive." };

    if (!cust.balances) cust.balances = {};
    var current = typeof cust.balances[businessId] === "number" ? cust.balances[businessId] : 0;
    var next = current + pointsDelta;
    if (next < 0) {
      return { ok: false, error: "Insufficient balance. Current: " + current + ", delta: " + pointsDelta };
    }

    var txId = "TX-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    var tx = {
      id: txId,
      customerId: customerId,
      customerName: cust.fullName || "",
      businessId: businessId,
      type: opts.type || (pointsDelta >= 0 ? "purchase" : "redemption"),
      amount: typeof opts.amount === "number" ? opts.amount : 0,
      points: pointsDelta,
      balanceAfter: next,
      employeeId: opts.employeeId || null,
      employee: opts.employee || "",
      datetime: opts.datetime || nowIso(),
      status: "success",
      invoice: opts.invoice || "",
      notes: opts.notes || "",
      rewardId: opts.rewardId || null,
      rewardName: opts.rewardName || null
    };

    cust.balances[businessId] = next;
    if (!Array.isArray(store.transactions)) store.transactions = [];
    store.transactions.unshift(tx);

    var saved = saveStore(store);
    if (!saved.ok) {
      // Roll back in-memory (best effort)
      cust.balances[businessId] = current;
      store.transactions.shift();
      return { ok: false, error: saved.error || "Failed to save store." };
    }

    return { ok: true, transaction: tx, balanceAfter: next };
  }

  function getTransactionsForCustomer(store, customerId, limit) {
    if (!store || !Array.isArray(store.transactions)) return [];
    var list = store.transactions.filter(function (t) { return t.customerId === customerId; });
    if (typeof limit === "number" && limit > 0) return list.slice(0, limit);
    return list;
  }

  function getRewardsForBusiness(store, businessId) {
    if (!store || !Array.isArray(store.rewards)) return [];
    return store.rewards.filter(function (r) {
      if (r.status && r.status !== "active") return false;
      if (!r.businessIds || !r.businessIds.length) return true;
      return r.businessIds.indexOf(businessId) !== -1 || r.businessIds.indexOf("all") !== -1;
    });
  }


  /* Customer identity – Level 1 */
  function normalizePhone(value) {
    var digits = String(value || "")
      .replace(/[۰-۹]/g, function (d) { return String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String("٠١٢٣٤٥٦٧٨٩".indexOf(d)); })
      .replace(/[^\d]/g, "");
    if (digits.indexOf("0098") === 0) digits = "0" + digits.slice(4);
    else if (digits.indexOf("98") === 0 && digits.length === 12) digits = "0" + digits.slice(2);
    else if (digits.length === 10 && digits.charAt(0) === "9") digits = "0" + digits;
    return digits;
  }
  function findCustomer(store, query) {
    if (!store || !Array.isArray(store.customers)) return null;
    var raw = String(query || "").trim();
    if (!raw) return null;
    var phone = normalizePhone(raw), upper = raw.toUpperCase();
    for (var i=0;i<store.customers.length;i++) {
      var c=store.customers[i];
      if (c.id===raw || (c.membershipId||"").toUpperCase()===upper ||
          (c.phone && normalizePhone(c.phone)===phone) || (c.qrToken && c.qrToken===raw)) return c;
    }
    return null;
  }
  function nextMembershipId(store) {
    var max=10244;
    (store.customers||[]).forEach(function(c){
      var m=String(c.membershipId||"").match(/^HM-(\d+)$/i);
      if(m) max=Math.max(max,Number(m[1]));
    });
    return "HM-"+String(max+1).padStart(5,"0");
  }
  function createCustomer(store,input) {
    if(!store || !Array.isArray(store.customers) || !input) return {ok:false,error:"Store and customer details are required."};
    var fullName=String(input.fullName||"").trim().replace(/\s+/g," ");
    var phone=normalizePhone(input.phone);
    if(fullName.length<3) return {ok:false,error:"نام مشتری باید حداقل ۳ نویسه باشد."};
    if(!/^09\d{9}$/.test(phone)) return {ok:false,error:"شماره موبایل باید یک شماره معتبر ایران باشد."};
    if(store.customers.some(function(c){return normalizePhone(c.phone)===phone;})) return {ok:false,error:"این شماره موبایل قبلاً ثبت شده است."};
    var c={id:"cust_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7),
      fullName:fullName,phone:phone,membershipId:nextMembershipId(store),
      qrToken:"HMQ-"+Math.random().toString(36).slice(2,12).toUpperCase(),
      status:"active",regDate:input.regDate||new Date().toLocaleDateString("fa-IR"),balances:{},leagues:{}};
    (store.businesses||[]).forEach(function(b){c.balances[b.id]=0;c.leagues[b.id]="برنزی";});
    store.customers.push(c);
    var saved=saveStore(store);
    if(!saved.ok){store.customers.pop();return {ok:false,error:saved.error||"ذخیره مشتری انجام نشد."};}
    return {ok:true,customer:c};
  }
  function updateCustomer(store,customerId,changes) {
    var c=getCustomerById(store,customerId);
    if(!c||!changes) return {ok:false,error:"مشتری یا اطلاعات اصلاحی پیدا نشد."};
    var oldName=c.fullName,oldPhone=c.phone;
    if(changes.fullName!==undefined){
      var name=String(changes.fullName||"").trim().replace(/\s+/g," ");
      if(name.length<3) return {ok:false,error:"نام مشتری معتبر نیست."}; c.fullName=name;
    }
    if(changes.phone!==undefined){
      var phone=normalizePhone(changes.phone);
      if(!/^09\d{9}$/.test(phone)){c.fullName=oldName;return {ok:false,error:"شماره موبایل معتبر نیست."};}
      if(store.customers.some(function(x){return x.id!==customerId&&normalizePhone(x.phone)===phone;})){
        c.fullName=oldName;return {ok:false,error:"این شماره موبایل برای مشتری دیگری ثبت شده است."};
      } c.phone=phone;
    }
    var saved=saveStore(store);
    if(!saved.ok){c.fullName=oldName;c.phone=oldPhone;return {ok:false,error:saved.error};}
    return {ok:true,customer:c};
  }
  function setCustomerStatus(store,customerId,status) {
    var c=getCustomerById(store,customerId);
    if(!c) return {ok:false,error:"مشتری پیدا نشد."};
    if(status!=="active"&&status!=="inactive") return {ok:false,error:"وضعیت نامعتبر است."};
    var old=c.status;c.status=status;var saved=saveStore(store);
    if(!saved.ok){c.status=old;return {ok:false,error:saved.error};}
    return {ok:true,customer:c};
  }

  /* Public API */
  var HamrahCore = {
    STORE_KEY: STORE_KEY,
    OLD_EMPLOYEE_KEY: OLD_EMPLOYEE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,

    loadStore: loadStore,
    saveStore: saveStore,
    resetDemoData: resetDemoData,
    isValidStore: isValidStore,
    createEmptyStore: createEmptyStore,

    getCustomerById: getCustomerById,
    normalizePhone: normalizePhone,
    findCustomer: findCustomer,
    createCustomer: createCustomer,
    updateCustomer: updateCustomer,
    setCustomerStatus: setCustomerStatus,
    getBusinessById: getBusinessById,
    getBalance: getBalance,
    getLeague: getLeague,
    applyTransaction: applyTransaction,
    getTransactionsForCustomer: getTransactionsForCustomer,
    getRewardsForBusiness: getRewardsForBusiness,

    // Exposed seed for tests / tooling
    SEED_CUSTOMERS: SEED_CUSTOMERS,
    SEED_BUSINESSES: SEED_BUSINESSES
  };

  global.HamrahCore = HamrahCore;
})(typeof window !== "undefined" ? window : this);
