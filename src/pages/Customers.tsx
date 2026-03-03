import React, { useState, useEffect } from "react";
import { Customer } from "../types";
import { Plus, Search, Phone, MapPin, MessageCircle, ArrowUpRight, ArrowDownRight, IndianRupee, X, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("Ledger Payment");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ledgerData, setLedgerData] = useState<{ sales: any[], payments: any[] }>({ sales: [], payments: [] });
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    address: "",
    gst: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/customers");
      setCustomers(await res.json());
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
        setNewCustomer({ name: "", phone: "", address: "", gst: "" });
      }
    } catch (err) {
      console.error("Failed to save customer", err);
    }
  }

  async function handleDeleteCustomer(id: number) {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Failed to delete customer", err);
    }
  }

  function openEditCustomer(customer: Customer) {
    setEditingId(customer.id);
    setNewCustomer(customer);
    setIsModalOpen(true);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || paymentAmount <= 0) return;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: 'customer',
          entity_id: selectedCustomer.id,
          amount: paymentAmount,
          payment_method: paymentMethod,
          notes: paymentNotes
        })
      });
      if (res.ok) {
        setIsPaymentModalOpen(false);
        setPaymentAmount(0);
        setPaymentNotes("Ledger Payment");
        
        if (paymentAmount >= selectedCustomer.outstanding_balance) {
          setIsLedgerOpen(false);
          setSelectedCustomer(null);
        } else {
          viewLedger(selectedCustomer);
        }
        fetchData();
      }
    } catch (err) {
      console.error("Failed to record payment", err);
    }
  }

  async function viewLedger(customer: Customer) {
    setSelectedCustomer(customer);
    try {
      const res = await fetch(`/api/customers/${customer.id}/ledger`);
      setLedgerData(await res.json());
      setIsLedgerOpen(true);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleWhatsApp = (phone: string, balance: number) => {
    const message = `Namaste! This is a reminder from Vastra Cloth Shop regarding your outstanding balance of ₹${balance}. Kindly settle it at your earliest convenience. Thank you!`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Track credit sales and outstanding balances.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Add Customer
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
        {filteredCustomers.map((customer) => (
          <motion.div 
            layout
            key={customer.id}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {customer.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => openEditCustomer(customer)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {customer.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.gst && (
                <div className="text-xs text-gray-400">
                  GST: <span className="text-gray-600 font-medium">{customer.gst}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Outstanding</p>
                <p className={`text-xl font-bold ${customer.outstanding_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ₹{customer.outstanding_balance.toLocaleString('en-IN')}
                </p>
              </div>
              <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleWhatsApp(customer.phone, customer.outstanding_balance)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Remind
              </button>
              <button 
                onClick={() => viewLedger(customer)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View Ledger
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Customer Modal */}
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
                <h2 className="text-xl font-bold text-gray-900">{editingId ? "Edit Customer" : "Add New Customer"}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newCustomer.name || ""}
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newCustomer.phone || ""}
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                  <textarea 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    rows={3}
                    value={newCustomer.address || ""}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newCustomer.gst || ""}
                    onChange={e => setNewCustomer({...newCustomer, gst: e.target.value})}
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
                    Save Customer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ledger Modal */}
      <AnimatePresence>
        {isLedgerOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLedgerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                <div>
                  <h2 className="text-xl font-bold">{selectedCustomer.name}'s Ledger</h2>
                  <p className="text-indigo-100 text-sm">Transaction History</p>
                </div>
                <button onClick={() => setIsLedgerOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Sales History</h3>
                  <div className="space-y-3">
                    {ledgerData.sales.map(sale => (
                      <div key={sale.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50">
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-gray-900">₹{sale.total_amount}</span>
                          <span className="text-xs text-gray-500">{new Date(sale.sale_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{sale.items}</p>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${sale.payment_method === 'credit' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {sale.payment_method}
                          </span>
                          <span className="text-xs text-gray-500">Paid: ₹{sale.paid_amount}</span>
                        </div>
                      </div>
                    ))}
                    {ledgerData.sales.length === 0 && <p className="text-center text-gray-400 py-4">No sales recorded</p>}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Payment History</h3>
                  <div className="space-y-3">
                    {ledgerData.payments.map(payment => (
                      <div key={payment.id} className="p-4 border border-emerald-100 rounded-2xl bg-emerald-50 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-emerald-700">₹{payment.amount}</p>
                          <p className="text-xs text-emerald-600">{payment.payment_method} - {payment.notes || 'No notes'}</p>
                        </div>
                        <span className="text-xs text-emerald-600">{new Date(payment.payment_date).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {ledgerData.payments.length === 0 && <p className="text-center text-gray-400 py-4">No payments recorded</p>}
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-medium">Current Balance</p>
                  <p className="text-2xl font-bold text-rose-600">₹{selectedCustomer.outstanding_balance.toLocaleString('en-IN')}</p>
                </div>
                <button 
                  onClick={() => {
                    setPaymentAmount(selectedCustomer.outstanding_balance);
                    setIsPaymentModalOpen(true);
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Record Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
                <h2 className="text-xl font-bold text-gray-900">Record Payment: {selectedCustomer.name}</h2>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-2xl font-bold text-indigo-600"
                    value={paymentAmount ?? 0}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-400 mt-1">Outstanding: ₹{selectedCustomer.outstanding_balance}</p>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    value={paymentNotes || ""}
                    onChange={e => setPaymentNotes(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
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
