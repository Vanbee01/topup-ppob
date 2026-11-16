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

// Allow checkout as guest: make orders.user_id nullable on existing databases.
const orderColumns=db.prepare('PRAGMA table_info(orders)').all();
if(orderColumns.some(c=>c.name==='user_id'&&c.notnull===1)){
 db.pragma('foreign_keys = OFF');
 db.exec(`CREATE TABLE orders_guest_migration(id INTEGER PRIMARY KEY,invoice TEXT UNIQUE NOT NULL,user_id INTEGER REFERENCES users(id),product_id INTEGER NOT NULL REFERENCES products(id),target TEXT NOT NULL,amount INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',payment_reference TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
 INSERT INTO orders_guest_migration SELECT id,invoice,user_id,product_id,target,amount,status,payment_reference,created_at,updated_at FROM orders;
 DROP TABLE orders;
 ALTER TABLE orders_guest_migration RENAME TO orders;`);
 db.pragma('foreign_keys = ON');
}

// Katalog demo diperluas. Harga hanya contoh sampai supplier resmi terhubung.
const add=db.prepare('INSERT OR IGNORE INTO products(category,provider_code,name,description,price) VALUES(?,?,?,?,?)');
const demo='Harga simulasi untuk tampilan katalog; transaksi otomatis belum aktif.';
const seed=[
['game','MLBB5','Mobile Legends — 5 Diamonds',demo,1500],
['game','MLBB12','Mobile Legends — 12 Diamonds',demo,3500],
['game','MLBB19','Mobile Legends — 19 Diamonds',demo,5500],
['game','MLBB28','Mobile Legends — 28 Diamonds',demo,8000],
['game','MLBB44','Mobile Legends — 44 Diamonds',demo,12000],
['game','MLBB59','Mobile Legends — 59 Diamonds',demo,16000],
['game','MLBB86','Mobile Legends — 86 Diamonds',demo,22000],
['game','MLBB170','Mobile Legends — 170 Diamonds',demo,43000],
['game','MLBB240','Mobile Legends — 240 Diamonds',demo,60000],
['game','MLBB296','Mobile Legends — 296 Diamonds',demo,74000],
['game','MLBB408','Mobile Legends — 408 Diamonds',demo,101000],
['game','MLBB568','Mobile Legends — 568 Diamonds',demo,139000],
['game','MLBB875','Mobile Legends — 875 Diamonds',demo,213000],
['game','MLBB2010','Mobile Legends — 2.010 Diamonds',demo,485000],
['game','MLBB4830','Mobile Legends — 4.830 Diamonds',demo,1150000],
['game','MLWEEKLY','Mobile Legends — Weekly Pass',demo,28000],
['game','MLTWILIGHT','Mobile Legends — Twilight Pass',demo,150000],
['game','FF5','Free Fire — 5 Diamonds',demo,1000],
['game','FF12','Free Fire — 12 Diamonds',demo,2000],
['game','FF50','Free Fire — 50 Diamonds',demo,8000],
['game','FF70','Free Fire — 70 Diamonds',demo,10000],
['game','FF140','Free Fire — 140 Diamonds',demo,20000],
['game','FF355','Free Fire — 355 Diamonds',demo,49000],
['game','FF720','Free Fire — 720 Diamonds',demo,97000],
['game','FF1450','Free Fire — 1.450 Diamonds',demo,190000],
['game','FF2180','Free Fire — 2.180 Diamonds',demo,285000],
['game','FF3640','Free Fire — 3.640 Diamonds',demo,475000],
['game','PUBG60','PUBG Mobile — 60 UC',demo,17000],
['game','PUBG325','PUBG Mobile — 325 UC',demo,79000],
['game','PUBG660','PUBG Mobile — 660 UC',demo,155000],
['game','PUBG1800','PUBG Mobile — 1.800 UC',demo,390000],
['game','PUBG3850','PUBG Mobile — 3.850 UC',demo,780000],
['game','PUBG8100','PUBG Mobile — 8.100 UC',demo,1550000],
['game','GI60','Genshin Impact — 60 Genesis Crystals',demo,16000],
['game','GI300','Genshin Impact — 300 Genesis Crystals',demo,79000],
['game','GI980','Genshin Impact — 980 Genesis Crystals',demo,239000],
['game','GI1980','Genshin Impact — 1.980 Genesis Crystals',demo,479000],
['game','GI3280','Genshin Impact — 3.280 Genesis Crystals',demo,799000],
['game','GI6480','Genshin Impact — 6.480 Genesis Crystals',demo,1590000],
['ppob','TEL10','Pulsa Telkomsel 10.000','Contoh katalog; belum live.',12000],
['ppob','PLN20','Token PLN 20.000','Contoh katalog; belum live.',22000],
['ppob','DATA5','Paket Data 5 GB','Contoh katalog; belum live.',28000]
];
for(const p of seed)add.run(...p);
module.exports=db;
