const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");
const dbPath = process.env.HAMRAH_DB_PATH || path.join(__dirname,"data","hamrah.sqlite");
fs.mkdirSync(path.dirname(dbPath),{recursive:true});
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(path.join(__dirname,"schema.sql"),"utf8"));
const businesses=[
 ["biz_1","کافه بیکری بیکرسو","کافه و نانوایی"],
 ["biz_2","رستوران سورن","رستوران"],
 ["biz_3","طلافروشی دینور","زیورآلات"],
 ["biz_4","صرافی آراکس","صرافی"],
 ["biz_5","گلخانه رویا","گل و گیاه"],
 ["biz_6","فست‌فود تیکا","فست‌فود"],
 ["biz_7","کافه باقلوا نوشکا","کافه و شیرینی"]
];
const ins=db.prepare("INSERT INTO businesses(id,name,category) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category");
const seed=db.transaction(()=>businesses.forEach(b=>ins.run(...b)));
seed();
// Backfill zero-point memberships for businesses added after customers already existed.
db.prepare(`INSERT OR IGNORE INTO customer_business_balances(customer_id,business_id,points,league)
 SELECT c.id,b.id,0,'برنزی' FROM customers c CROSS JOIN businesses b WHERE b.status='active'`).run();
const count=db.prepare("SELECT COUNT(*) AS n FROM customers").get().n;
if(!count){
 const add=db.prepare("INSERT INTO customers(id,full_name,phone,membership_id,qr_token,status) VALUES(?,?,?,?,?,'active')");
 const bal=db.prepare("INSERT INTO customer_business_balances(customer_id,business_id,points,league) VALUES(?,?,?,?)");
 const samples=[
  ["cust_1","آریا فرهمند","09123456789","HM-10245","HMQ-DEMO10245"],
  ["cust_2","نیلوفر بهرامی","09121112233","HM-10246","HMQ-DEMO10246"],
  ["cust_3","آرش نیک‌پی","09125556677","HM-10247","HMQ-DEMO10247"],
  ["cust_4","باران پارسا","09128889900","HM-10248","HMQ-DEMO10248"],
  ["cust_5","کیان راد","09123334455","HM-10249","HMQ-DEMO10249"]
 ];
 const points=[[2450,1200,850,3100,500,0,0],[800,3400,200,1500,0,0,0],[5200,900,4100,800,1200,0,0],[350,150,0,600,2800,0,0],[100,50,0,0,0,0,0]];
 const tx=db.transaction(()=>samples.forEach((c,i)=>{add.run(...c);businesses.forEach((b,j)=>bal.run(c[0],b[0],points[i][j],"برنزی"));}));
 tx();
}
module.exports=db;
