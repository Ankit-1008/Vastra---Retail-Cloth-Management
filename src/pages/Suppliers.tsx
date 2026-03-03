import React, { useState, useEffect } from "react";
import { Supplier, Product } from "../types";
import { Plus, Search, Phone, CreditCard, Calendar, ArrowUpRight, X, Minus, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<{ product_id: number, quantity: number, unit_price: number }[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: "",
    phone: "",
    payment_terms: "",
    upi_details: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [suppRes, prodRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/products")
      ]);
      setSuppliers(await suppRes.json());
      setProducts(await prodRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSupplier || purchaseItems.length === 0) return;

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: selectedSupplier.id,
          items: purchaseItems,
          paid_amount: 0, // For simplicity, assume all credit for now
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
      if (res.ok) {
        setIsPurchaseModalOpen(false);
        setPurchaseItems([]);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to record purchase", err);
    }
  }

  async function handlePaySupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSupplier || paymentAmount <= 0) return;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: 'supplier',
          entity_id: selectedSupplier.id,
          amount: paymentAmount,
          payment_method: paymentMethod,
          notes: 'Supplier Payment'
        })
      });
      if (res.ok) {
        setIsPaymentModalOpen(false);
        setPaymentAmount(0);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to pay supplier", err);
    }
  }

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplier)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
        setNewSupplier({ name: "", phone: "", payment_terms: "", upi_details: "" });
      }
    } catch (err) {
      console.error("Failed to save supplier", err);
    }
  }

  async function handleDeleteSupplier(id: number) {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Failed to delete supplier", err);
    }
  }

  function openEditSupplier(supplier: Supplier) {
    setEditingId(supplier.id);
    setNewSupplier(supplier);
    setIsModalOpen(true);
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500">Manage your vendors and purchase payments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Add Supplier
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => (
          <motion.div 
            layout
            key={supplier.id}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {supplier.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{supplier.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="w-3 h-3" />
                    {supplier.phone}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => openEditSupplier(supplier)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Terms: <span className="font-medium">{supplier.payment_terms || "N/A"}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span>UPI: <span className="font-medium">{supplier.upi_details || "N/A"}</span></span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Total Payable</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{supplier.total_payable.toLocaleString('en-IN')}
                </p>
              </div>
              <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setIsPurchaseModalOpen(true);
                }}
                className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                Record Purchase
              </button>
              <button 
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setPaymentAmount(supplier.total_payable);
                  setIsPaymentModalOpen(true);
                }}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Pay Supplier
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{editingId ? "Edit Supplier" : "Add New Supplier"}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newSupplier.name || ""}
                    onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newSupplier.phone || ""}
                    onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (e.g. 30 Days)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newSupplier.payment_terms || ""}
                    onChange={e => setNewSupplier({...newSupplier, payment_terms: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI / Bank Details</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newSupplier.upi_details || ""}
                    onChange={e => setNewSupplier({...newSupplier, upi_details: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  >
                    Save Supplier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Purchase Modal */}
      <AnimatePresence>
        {isPurchaseModalOpen && selectedSupplier && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPurchaseModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Record Purchase: {selectedSupplier.name}</h2>
                <button onClick={() => setIsPurchaseModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleRecordPurchase} className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Add Items</label>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl"
                      onChange={(e) => {
                        const pid = Number(e.target.value);
                        if (!pid) return;
                        const product = products.find(p => p.id === pid);
                        if (product) {
                          setPurchaseItems([...purchaseItems, { product_id: pid, quantity: 1, unit_price: product.purchase_price }]);
                        }
                        e.target.value = "";
                      }}
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.design_name} ({p.size})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {purchaseItems.map((item, idx) => {
                    const product = products.find(p => p.id === item.product_id);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{product?.design_name}</p>
                          <p className="text-xs text-gray-500">{product?.size} / {product?.color}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...purchaseItems];
                              newItems[idx].quantity = Number(e.target.value);
                              setPurchaseItems(newItems);
                            }}
                          />
                          <input 
                            type="number" 
                            className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm"
                            value={item.unit_price}
                            onChange={(e) => {
                              const newItems = [...purchaseItems];
                              newItems[idx].unit_price = Number(e.target.value);
                              setPurchaseItems(newItems);
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))}
                            className="text-rose-500 p-1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500">Total Purchase Value</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{purchaseItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button 
                    type="submit"
                    disabled={purchaseItems.length === 0}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    Record Purchase
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pay Supplier Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedSupplier && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Pay Supplier: {selectedSupplier.name}</h2>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePaySupplier} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-2xl font-bold text-indigo-600"
                    value={paymentAmount ?? 0}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-400 mt-1">Outstanding: ₹{selectedSupplier.total_payable}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    value={paymentMethod || "Cash"}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100"
                >
                  Confirm Payment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
