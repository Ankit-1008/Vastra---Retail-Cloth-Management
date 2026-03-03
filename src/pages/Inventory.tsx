import React, { useState, useEffect } from "react";
import { Product, Supplier } from "../types";
import { Plus, Search, Filter, AlertCircle, Edit2, Trash2, IndianRupee, X as CloseIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "react-router-dom";

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    design_name: "",
    category: "Shirt",
    size: "M",
    color: "",
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    reorder_level: 5
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [prodRes, suppRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/suppliers")
      ]);
      setProducts(await prodRes.json());
      setSuppliers(await suppRes.json());
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
        setNewProduct({
          design_name: "",
          category: "Shirt",
          size: "M",
          color: "",
          purchase_price: 0,
          selling_price: 0,
          stock_quantity: 0,
          reorder_level: 5
        });
      }
    } catch (err) {
      console.error("Failed to save product", err);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setNewProduct(product);
    setIsModalOpen(true);
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.design_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.color.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isLowStockFilter = searchParams.get("filter") === "low-stock";
    if (isLowStockFilter) {
      return matchesSearch && p.stock_quantity <= p.reorder_level;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">Manage your stock and designs.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by design, category, or color..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {searchParams.get("filter") === "low-stock" && (
            <button 
              onClick={() => {
                searchParams.delete("filter");
                setSearchParams(searchParams);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              Low Stock Only
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <motion.div 
            layout
            key={product.id}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {product.stock_quantity <= product.reorder_level && (
              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                LOW STOCK
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">
                  {product.category}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">{product.design_name}</h3>
                <p className="text-sm text-gray-500">{product.brand || "No Brand"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-medium">Selling Price</p>
                <p className="text-lg font-bold text-gray-900 flex items-center justify-end">
                  <IndianRupee className="w-4 h-4" />
                  {product.selling_price}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Size / Color</p>
                <p className="text-sm font-semibold text-gray-700">{product.size} / {product.color}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-medium">Stock</p>
                <p className={cn(
                  "text-sm font-bold",
                  product.stock_quantity <= product.reorder_level ? "text-rose-600" : "text-emerald-600"
                )}>
                  {product.stock_quantity} Units
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">Supplier: <span className="text-gray-600 font-medium">{product.supplier_name || "Direct"}</span></p>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEdit(product)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Product Modal */}
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
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{editingId ? "Edit Product" : "Add New Product"}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Design Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.design_name || ""}
                      onChange={e => setNewProduct({...newProduct, design_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.category || "Shirt"}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option>Shirt</option>
                      <option>Pant</option>
                      <option>Saree</option>
                      <option>Suit</option>
                      <option>T-Shirt</option>
                      <option>Jeans</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.brand || ""}
                      onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.size || ""}
                      onChange={e => setNewProduct({...newProduct, size: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.color || ""}
                      onChange={e => setNewProduct({...newProduct, color: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.purchase_price ?? 0}
                      onChange={e => setNewProduct({...newProduct, purchase_price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.selling_price ?? 0}
                      onChange={e => setNewProduct({...newProduct, selling_price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.stock_quantity ?? 0}
                      onChange={e => setNewProduct({...newProduct, stock_quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.reorder_level ?? 0}
                      onChange={e => setNewProduct({...newProduct, reorder_level: Number(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={newProduct.supplier_id || ""}
                      onChange={e => setNewProduct({...newProduct, supplier_id: Number(e.target.value)})}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
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
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
