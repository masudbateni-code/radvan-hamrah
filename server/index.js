const express=require("express");
const crypto=require("node:crypto");
const path=require("node:path");
const db=require("./db");
const app=express();
const PORT=process.env.PORT||3000;
app.use(express.json({limit:"100kb"}));
app.use(express.static(path.resolve(__dirname,"..")));
function digits(v){return String(v||"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g,"")}
function phone(v){let d=digits(v);if(d.startsWith("0098"))d="0"+d.slice(4);else if(d.startsWith("98")&&d.length===12)d="0"+d.slice(2);else if(d.length===10&&d[0]==="9")d="0"+d;return d}
function publicCustomer(row){
 if(!row)return null;
 const balances=db.prepare(`SELECT business_id AS businessId,points,league FROM customer_business_balances WHERE customer_id=?`).all(row.id);
 return {id:row.id,fullName:row.full_name,phone:row.phone,membershipId:row.membership_id,qrToken:row.qr_token,status:row.status,registeredAt:row.registered_at,balances};
}
function byQuery(q){
 const p=phone(q),raw=String(q||"").trim();
 return db.prepare(`SELECT * FROM customers WHERE id=? OR membership_id=? COLLATE NOCASE OR phone=? OR qr_token=?`).get(raw,raw,p,raw);
}
app.get("/api/health",(req,res)=>res.json({ok:true,service:"RADVAN HAMRAH API",database:"SQLite"}));
app.get("/api/businesses",(req,res)=>res.json(db.prepare("SELECT * FROM businesses WHERE status='active' ORDER BY id").all()));
app.get("/api/customers",(req,res)=>{
 const q=String(req.query.q||"").trim();
 if(q){const c=byQuery(q);return c?res.json(publicCustomer(c)):res.status(404).json({error:"مشتری پیدا نشد."});}
 const rows=db.prepare("SELECT * FROM customers ORDER BY registered_at DESC").all();
 res.json(rows.map(publicCustomer));
});
app.post("/api/customers",(req,res)=>{
 const fullName=String(req.body.fullName||"").trim().replace(/\s+/g," "),p=phone(req.body.phone);
 if(fullName.length<3)return res.status(400).json({error:"نام مشتری باید حداقل ۳ نویسه باشد."});
 if(!/^09\d{9}$/.test(p))return res.status(400).json({error:"شماره موبایل معتبر ایران وارد کنید."});
 const duplicate=db.prepare("SELECT id FROM customers WHERE phone=?").get(p);
 if(duplicate)return res.status(409).json({error:"این شماره موبایل قبلاً ثبت شده است."});
 const max=db.prepare("SELECT MAX(CAST(SUBSTR(membership_id,4) AS INTEGER)) AS n FROM customers WHERE membership_id GLOB 'HM-[0-9]*'").get().n||10244;
 const id="cust_"+crypto.randomUUID(),membershipId="HM-"+String(max+1).padStart(5,"0"),qrToken="HMQ-"+crypto.randomBytes(6).toString("hex").toUpperCase();
 const create=db.transaction(()=>{
  db.prepare("INSERT INTO customers(id,full_name,phone,membership_id,qr_token) VALUES(?,?,?,?,?)").run(id,fullName,p,membershipId,qrToken);
  db.prepare("INSERT INTO customer_business_balances(customer_id,business_id,points,league) SELECT ?,id,0,'برنزی' FROM businesses WHERE status='active'").run(id);
 });
 try{create();res.status(201).json(publicCustomer(db.prepare("SELECT * FROM customers WHERE id=?").get(id)));}
 catch(e){res.status(500).json({error:"ثبت مشتری انجام نشد."});}
});
app.patch("/api/customers/:id",(req,res)=>{
 const row=db.prepare("SELECT * FROM customers WHERE id=?").get(req.params.id);
 if(!row)return res.status(404).json({error:"مشتری پیدا نشد."});
 const name=req.body.fullName===undefined?row.full_name:String(req.body.fullName).trim().replace(/\s+/g," ");
 const p=req.body.phone===undefined?row.phone:phone(req.body.phone);
 const status=req.body.status===undefined?row.status:req.body.status;
 if(name.length<3)return res.status(400).json({error:"نام مشتری معتبر نیست."});
 if(!/^09\d{9}$/.test(p))return res.status(400).json({error:"شماره موبایل معتبر نیست."});
 if(!["active","inactive"].includes(status))return res.status(400).json({error:"وضعیت حساب نامعتبر است."});
 try{
  db.prepare("UPDATE customers SET full_name=?,phone=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(name,p,status,row.id);
  res.json(publicCustomer(db.prepare("SELECT * FROM customers WHERE id=?").get(row.id)));
 }catch(e){res.status(409).json({error:"شماره موبایل تکراری است یا تغییرات ذخیره نشد."});}
});
app.listen(PORT,()=>console.log(`Hamrah API ready: http://localhost:${PORT}`));
