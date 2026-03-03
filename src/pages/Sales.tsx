import { useState, useEffect } from "react";
import { Product, Customer, SaleItem } from "../types";
import { Search, ShoppingCart, IndianRupee, Plus, Minus, Trash2, User, CreditCard, Banknote, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<(SaleItem & { design_name: string })[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'mixed'>('cash');
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [prodRes, custRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/customers")
      ]);
      setProducts(await prodRes.json());
      setCustomers(await custRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) return;
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        design_name: product.design_name, 
        quantity: 1, 
        unit_price: product.selling_price 
      }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = item.quantity + delta;
        if (newQty > 0 && (!product || newQty <= product.stock_quantity)) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = subtotal + gstAmount;

  async function handleCheckout() {
    if (cart.length === 0) return;
    
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          items: cart,
          paid_amount: paidAmount,
          payment_method: paymentMethod,
          gst_amount: gstAmount,
          due_date: paymentMethod === 'credit' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        setCart([]);
        setPaidAmount(0);
        setSelectedCustomerId(null);
        fetchData();
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Checkout failed", err);
    }
  }

  const filteredProducts = products.filter(p => 
    p.design_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      {/* Product Selection */}
      <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              disabled={product.stock_quantity === 0}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left relative group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                  {product.category}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.stock_quantity > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                  {product.stock_quantity} Left
                </span>
              </div>
              <h3 className="font-bold text-gray-900 truncate">{product.design_name}</h3>
              <p className="text-xs text-gray-500 mb-3">{product.size} / {product.color}</p>
              <div className="flex items-center justify-between">
                <p className="font-bold text-indigo-600 flex items-center">
                  <IndianRupee className="w-3 h-3" />
                  {product.selling_price}
                </p>
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Current Cart
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{item.design_name}</h4>
                  <p className="text-xs text-gray-500">₹{item.unit_price} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-white rounded shadow-sm transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-white rounded shadow-sm transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.product_id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select 
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={selectedCustomerId || ""}
                onChange={e => setSelectedCustomerId(Number(e.target.value) || null)}
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Method</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${paymentMethod === 'cash' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  <Banknote className="w-4 h-4" />
                  <span className="text-[10px] font-bold">CASH</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('credit')}
                  className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${paymentMethod === 'credit' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[10px] font-bold">CREDIT</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Paid Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="number" 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={paidAmount}
                  onChange={e => setPaidAmount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST (Optional)</span>
              <input 
                type="number" 
                className="w-20 text-right bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none"
                value={gstAmount}
                onChange={e => setGstAmount(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            Complete Checkout
          </button>
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-indigo-600 flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
            >
              <CheckCircle2 className="w-24 h-24 mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">Sale Successful!</h2>
            <p className="text-indigo-100">Inventory updated and transaction recorded.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
