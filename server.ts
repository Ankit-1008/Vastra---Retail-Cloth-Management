import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("vastra.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    gst TEXT,
    outstanding_balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    payment_terms TEXT,
    upi_details TEXT,
    total_payable REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    design_name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    purchase_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    supplier_id INTEGER,
    reorder_level INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    payment_method TEXT, -- 'cash', 'credit', 'mixed'
    gst_amount REAL DEFAULT 0,
    profit REAL NOT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    purchase_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'customer' or 'supplier'
    entity_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_method TEXT,
    notes TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    const salesToday = db.prepare("SELECT SUM(total_amount) as total FROM sales WHERE date(sale_date) = ?").get(today) as any;
    const profitToday = db.prepare("SELECT SUM(profit) as total FROM sales WHERE date(sale_date) = ?").get(today) as any;
    const outstandingCredit = db.prepare("SELECT SUM(outstanding_balance) as total FROM customers").get() as any;
    const lowStockCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= reorder_level").get() as any;
    const stockValue = db.prepare("SELECT SUM(stock_quantity * purchase_price) as total FROM products").get() as any;

    res.json({
      todaySales: salesToday?.total || 0,
      todayProfit: profitToday?.total || 0,
      totalOutstanding: outstandingCredit?.total || 0,
      lowStockItems: lowStockCount?.count || 0,
      totalStockValue: stockValue?.total || 0
    });
  });

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, s.name as supplier_name 
      FROM products p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id
    `).all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { design_name, category, brand, size, color, purchase_price, selling_price, stock_quantity, supplier_id, reorder_level } = req.body;
    const info = db.prepare(`
      INSERT INTO products (design_name, category, brand, size, color, purchase_price, selling_price, stock_quantity, supplier_id, reorder_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(design_name, category, brand, size, color, purchase_price, selling_price, stock_quantity, supplier_id, reorder_level);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { design_name, category, brand, size, color, purchase_price, selling_price, stock_quantity, supplier_id, reorder_level } = req.body;
    db.prepare(`
      UPDATE products 
      SET design_name = ?, category = ?, brand = ?, size = ?, color = ?, purchase_price = ?, selling_price = ?, stock_quantity = ?, supplier_id = ?, reorder_level = ?
      WHERE id = ?
    `).run(design_name, category, brand, size, color, purchase_price, selling_price, stock_quantity, supplier_id, reorder_level, id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Customers
  app.get("/api/customers", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers ORDER BY outstanding_balance DESC").all();
    res.json(customers);
  });

  app.post("/api/customers", (req, res) => {
    const { name, phone, address, gst } = req.body;
    const info = db.prepare("INSERT INTO customers (name, phone, address, gst) VALUES (?, ?, ?, ?)").run(name, phone, address, gst);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    const { name, phone, address, gst } = req.body;
    db.prepare("UPDATE customers SET name = ?, phone = ?, address = ?, gst = ? WHERE id = ?").run(name, phone, address, gst, id);
    res.json({ success: true });
  });

  app.delete("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    const transaction = db.transaction(() => {
      // Delete sale items first
      db.prepare(`
        DELETE FROM sale_items 
        WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = ?)
      `).run(id);
      
      // Delete sales
      db.prepare("DELETE FROM sales WHERE customer_id = ?").run(id);
      
      // Delete payments
      db.prepare("DELETE FROM payments WHERE entity_type = 'customer' AND entity_id = ?").run(id);
      
      // Finally delete customer
      db.prepare("DELETE FROM customers WHERE id = ?").run(id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/customers/:id/ledger", (req, res) => {
    const { id } = req.params;
    const sales = db.prepare(`
      SELECT s.*, GROUP_CONCAT(p.design_name || ' (' || si.quantity || ')') as items
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE s.customer_id = ?
      GROUP BY s.id
      ORDER BY s.sale_date DESC
    `).all(id);
    
    const payments = db.prepare(`
      SELECT * FROM payments 
      WHERE entity_type = 'customer' AND entity_id = ?
      ORDER BY payment_date DESC
    `).all(id);

    res.json({ sales, payments });
  });

  // Suppliers
  app.get("/api/suppliers", (req, res) => {
    const suppliers = db.prepare("SELECT * FROM suppliers").all();
    res.json(suppliers);
  });

  app.post("/api/suppliers", (req, res) => {
    const { name, phone, payment_terms, upi_details } = req.body;
    const info = db.prepare("INSERT INTO suppliers (name, phone, payment_terms, upi_details) VALUES (?, ?, ?, ?)").run(name, phone, payment_terms, upi_details);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/suppliers/:id", (req, res) => {
    const { id } = req.params;
    const { name, phone, payment_terms, upi_details } = req.body;
    db.prepare("UPDATE suppliers SET name = ?, phone = ?, payment_terms = ?, upi_details = ? WHERE id = ?").run(name, phone, payment_terms, upi_details, id);
    res.json({ success: true });
  });

  app.delete("/api/suppliers/:id", (req, res) => {
    const { id } = req.params;
    const transaction = db.transaction(() => {
      // Delete purchase items first
      db.prepare(`
        DELETE FROM purchase_items 
        WHERE purchase_id IN (SELECT id FROM purchases WHERE supplier_id = ?)
      `).run(id);
      
      // Delete purchases
      db.prepare("DELETE FROM purchases WHERE supplier_id = ?").run(id);
      
      // Delete payments
      db.prepare("DELETE FROM payments WHERE entity_type = 'supplier' AND entity_id = ?").run(id);
      
      // Finally delete supplier
      db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/suppliers/:id/ledger", (req, res) => {
    const { id } = req.params;
    const purchases = db.prepare(`
      SELECT p.*, GROUP_CONCAT(pr.design_name || ' (' || pi.quantity || ')') as items
      FROM purchases p
      JOIN purchase_items pi ON p.id = pi.purchase_id
      JOIN products pr ON pi.product_id = pr.id
      WHERE p.supplier_id = ?
      GROUP BY p.id
      ORDER BY p.purchase_date DESC
    `).all(id);

    const payments = db.prepare(`
      SELECT * FROM payments 
      WHERE entity_type = 'supplier' AND entity_id = ?
      ORDER BY payment_date DESC
    `).all(id);

    res.json({ purchases, payments });
  });

  app.post("/api/purchases", (req, res) => {
    const { supplier_id, items, paid_amount, due_date } = req.body;
    const transaction = db.transaction(() => {
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
        // Update stock
        db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?").run(item.quantity, item.product_id);
      }

      const purchaseInfo = db.prepare(`
        INSERT INTO purchases (supplier_id, total_amount, paid_amount, due_date)
        VALUES (?, ?, ?, ?)
      `).run(supplier_id, totalAmount, paid_amount, due_date);

      const purchaseId = purchaseInfo.lastInsertRowid;

      for (const item of items) {
        db.prepare(`
          INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price)
          VALUES (?, ?, ?, ?)
        `).run(purchaseId, item.product_id, item.quantity, item.unit_price);
      }

      // Update Supplier Balance
      const balance = totalAmount - paid_amount;
      db.prepare("UPDATE suppliers SET total_payable = total_payable + ? WHERE id = ?").run(balance, supplier_id);

      return purchaseId;
    });

    try {
      const id = transaction();
      res.json({ id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/payments", (req, res) => {
    const { entity_type, entity_id, amount, payment_method, notes } = req.body;
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO payments (entity_type, entity_id, amount, payment_method, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(entity_type, entity_id, amount, payment_method, notes);

      if (entity_type === 'customer') {
        db.prepare("UPDATE customers SET outstanding_balance = ROUND(outstanding_balance - ?, 2) WHERE id = ?").run(amount, entity_id);
        
        // Automate delete after clearing dues
        const customer = db.prepare("SELECT outstanding_balance FROM customers WHERE id = ?").get(entity_id) as any;
        if (customer && customer.outstanding_balance <= 0) {
          db.prepare(`
            DELETE FROM sale_items 
            WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = ?)
          `).run(entity_id);
          db.prepare("DELETE FROM sales WHERE customer_id = ?").run(entity_id);
          db.prepare("DELETE FROM payments WHERE entity_type = 'customer' AND entity_id = ?").run(entity_id);
          db.prepare("DELETE FROM customers WHERE id = ?").run(entity_id);
        }
      } else {
        db.prepare("UPDATE suppliers SET total_payable = ROUND(total_payable - ?, 2) WHERE id = ?").run(amount, entity_id);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Sales
  app.post("/api/sales", (req, res) => {
    const { customer_id, items, paid_amount, payment_method, gst_amount, due_date } = req.body;
    
    const transaction = db.transaction(() => {
      let totalAmount = 0;
      let totalProfit = 0;

      // Calculate totals and update stock
      for (const item of items) {
        const product = db.prepare("SELECT purchase_price, selling_price, stock_quantity FROM products WHERE id = ?").get(item.product_id) as any;
        if (!product || product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_id}`);
        }

        const itemTotal = item.quantity * item.unit_price;
        const itemProfit = (item.unit_price - product.purchase_price) * item.quantity;
        
        totalAmount += itemTotal;
        totalProfit += itemProfit;

        // Update stock
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?").run(item.quantity, item.product_id);
      }

      totalAmount += (gst_amount || 0);

      // Create Sale record
      const saleInfo = db.prepare(`
        INSERT INTO sales (customer_id, total_amount, paid_amount, payment_method, gst_amount, profit, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(customer_id, totalAmount, paid_amount, payment_method, gst_amount, totalProfit, due_date);

      const saleId = saleInfo.lastInsertRowid;

      // Create Sale Items
      for (const item of items) {
        const product = db.prepare("SELECT purchase_price FROM products WHERE id = ?").get(item.product_id) as any;
        db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, purchase_price)
          VALUES (?, ?, ?, ?, ?)
        `).run(saleId, item.product_id, item.quantity, item.unit_price, product.purchase_price);
      }

      // Update Customer Balance if credit
      if (customer_id && totalAmount > paid_amount) {
        const balance = totalAmount - paid_amount;
        db.prepare("UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?").run(balance, customer_id);
      }

      return saleId;
    });

    try {
      const saleId = transaction();
      res.json({ id: saleId });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Analytics
  app.get("/api/analytics/fast-moving", (req, res) => {
    const fastMoving = db.prepare(`
      SELECT p.design_name, p.category, SUM(si.quantity) as total_sold
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 10
    `).all();
    res.json(fastMoving);
  });

  app.get("/api/analytics/monthly-sales", (req, res) => {
    const monthlySales = db.prepare(`
      SELECT strftime('%Y-%m', sale_date) as month, SUM(total_amount) as total, SUM(profit) as profit
      FROM sales
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all();
    res.json(monthlySales);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
