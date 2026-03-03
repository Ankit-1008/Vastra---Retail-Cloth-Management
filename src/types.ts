export interface Product {
  id: number;
  design_name: string;
  category: string;
  brand?: string;
  size: string;
  color: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  supplier_id?: number;
  supplier_name?: string;
  reorder_level: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  gst?: string;
  outstanding_balance: number;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  payment_terms?: string;
  upi_details?: string;
  total_payable: number;
}

export interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Sale {
  id: number;
  customer_id?: number;
  total_amount: number;
  paid_amount: number;
  payment_method: 'cash' | 'credit' | 'mixed';
  gst_amount: number;
  profit: number;
  sale_date: string;
  due_date?: string;
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  totalOutstanding: number;
  lowStockItems: number;
  totalStockValue: number;
}
