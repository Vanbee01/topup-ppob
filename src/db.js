const Database=require('better-sqlite3');
const fs=require('fs');
const path=require('path');
const dir=process.env.DATA_DIR||'./data';
fs.mkdirSync(dir,{recursive:true});
const db=new Database(path.join(dir,'topup.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE COLLATE NOCASE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'customer',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,category TEXT NOT NULL,provider_code TEXT UNIQUE NOT NULL,name TEXT NOT NULL,description TEXT,price INTEGER NOT NULL CHECK(price>0),active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY,invoice TEXT UNIQUE NOT NULL,user_id INTEGER NOT NULL REFERENCES users(id),product_id INTEGER NOT NULL REFERENCES products(id),target TEXT NOT NULL,amount INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',payment_reference TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
if(db.prepare('SELECT COUNT(*) n FROM products').get().n===0){
 const add=db.prepare('INSERT INTO products(category,provider_code,name,description,price) VALUES(?,?,?,?,?)');
 const seed=[['game','MLBB86','Mobile Legends — 86 Diamonds','Contoh katalog; belum terhubung supplier.',22000],['game','FF100','Free Fire — 100 Diamonds','Contoh katalog; belum live.',16000],['game','PUBG60','PUBG Mobile — 60 UC','Contoh katalog; belum live.',17000],['ppob','TEL10','Pulsa Telkomsel 10.000','Contoh katalog; belum live.',12000],['ppob','PLN20','Token PLN 20.000','Contoh katalog; belum live.',22000],['ppob','DATA5','Paket Data 5 GB','Contoh katalog; belum live.',28000]];
 for(const p of seed)add.run(...p);
}
module.exports=db;
