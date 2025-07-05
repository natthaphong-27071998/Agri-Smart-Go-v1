

export interface Employee {
  id: string;
  name: string;
  nickname: string | null;
  dob: string | null;
  age: number | null;
  idCard: string | null;
  address: string | null;
  phone: string | null;
  startDate: string | null;
  position: string | null;
  salary: number | null;
  status: 'Active' | 'Inactive' | null;
}

export interface Customer {
    id: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    joinDate: string | null;
}

export interface Product {
    id: string;
    name: string;
    category: string | null;
    unitPrice: number | null;
    costPrice: number | null;
    stockQuantity: number | null;
    lowStockThreshold: number | null;
}

export interface SalesOrderRecord {
  id: string;
  order_code: string;
  customerId: string | null;
  customerName: string | null;
  orderDate: string | null;
  status: 'Quote' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | null;
  totalAmount: number | null;
}

export interface SalesOrder extends SalesOrderRecord {
  items: OrderItem[];
}


export interface OrderItem {
    productId: string;
    productName: string | null;
    quantity: number | null;
    unitPrice: number | null;
    total: number;
}

// This type mirrors the 'order_items' table in the database
export interface OrderItemRow {
  id: number;
  order_id: string;
  productId: string;
  productName: string | null;
  quantity: number | null;
  unitPrice: number | null;
}


export interface FinancialTransaction {
  id: string;
  date: string | null;
  description: string | null;
  type: 'Income' | 'Expense' | null;
  category: string | null;
  amount: number | null;
}

export type UserRole = 'Admin' | 'Farm Manager' | 'Accountant' | 'Sales' | 'Worker';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  status: 'Active' | 'Inactive' | null;
  avatarUrl?: string | null;
}

// --- Production Management Types ---

export type PlotStatus = 'ว่าง' | 'เตรียมดิน' | 'กำลังเติบโต' | 'พร้อมเก็บเกี่ยว' | 'เก็บเกี่ยวแล้ว';
export type ActivityType = 'เตรียมดิน' | 'ปลูก' | 'ใส่ปุ๋ย' | 'รดน้ำ' | 'กำจัดวัชพืช' | 'เก็บเกี่ยว';
export type ActivityStatus = 'วางแผน' | 'กำลังดำเนินการ' | 'เสร็จสิ้น';
export type DeviceStatus = 'Online' | 'Offline' | 'Needs Setup';

export interface Plot {
  id: string;
  name: string | null;
  crop: string | null;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  status: PlotStatus | null;
  size: number | null; // in rai
}

export interface FarmActivity {
  id: string;
  date: string | null;
  activityType: ActivityType | null;
  plotId: string | null;
  plotName: string | null;
  assignedTo: string | null; // Employee name
  status: ActivityStatus | null;
}

export interface IoTDevice {
    id: string; // Internal UUID
    device_id: string; // User-facing ID (e.g., MAC address)
    name: string | null;
    plot_id: string | null;
    sensor_type: string | null;
    status: DeviceStatus | null;
    last_heartbeat: string | null;
}

export interface SensorData {
    plotId: string;
    plotName: string;
    temperature: number; // Celsius
    humidity: number; // %
    soilMoisture: number; // %
    lastUpdated: string;
}

// --- Farm Accounting Types ---

export interface ChartOfAccount {
    code: string;
    name: string;
    type: 'สินทรัพย์' | 'หนี้สิน' | 'ส่วนของผู้ถือหุ้น' | 'รายได้' | 'ค่าใช้จ่าย';
    description: string;
}

export interface Asset {
    id: string;
    name: string | null;
    purchaseDate: string | null;
    purchaseCost: number | null;
    usefulLife: number | null; // years
    salvageValue: number | null;
    depreciationMethod: 'Straight-line' | null;
    status: 'ใช้งาน' | 'ซ่อมบำรุง' | 'จำหน่ายแล้ว' | null;
}

export type PaymentStatus = 'ค้างชำระ' | 'ชำระแล้ว' | 'ค้างจ่าย' | 'จ่ายแล้ว';

export interface Receivable {
    id: string;
    customerName: string | null;
    invoiceId: string | null;
    issueDate: string | null;
    dueDate: string | null;
    amount: number | null;
    status: PaymentStatus | null;
}

export interface Payable {
    id: string;
    vendorName: string | null;
    invoiceId: string | null;
    issueDate: string | null;
    dueDate: string | null;
    amount: number | null;
    status: PaymentStatus | null;
}

// --- Investment & Risk Management Types ---

export type InvestmentStatus = 'วางแผน' | 'อนุมัติแล้ว' | 'กำลังดำเนินการ' | 'เสร็จสิ้น';
export type RiskLevel = 'ต่ำ' | 'ปานกลาง' | 'สูง';
export type RiskCategory = 'ภัยธรรมชาติ' | 'โรคระบาด' | 'ราคาตลาด' | 'การดำเนินงาน';
export type RiskStatus = 'ระบุแล้ว' | 'กำลังจัดการ' | 'จัดการแล้ว' | 'เกิดขึ้นจริง';


export interface InvestmentProject {
    id: string;
    name: string | null;
    description: string | null;
    investmentCost: number | null;
    expectedRevenue: number | null;
    status: InvestmentStatus | null;
}

export interface RiskItem {
    id: string;
    riskName: string | null;
    category: RiskCategory | null;
    likelihood: RiskLevel | null; // โอกาสเกิด
    impact: RiskLevel | null; // ผลกระทบ
    mitigationPlan: string | null; // แผนรับมือ
    status: RiskStatus | null;
}

// --- Permission Management Types ---
export interface PermissionLevel {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type ModulePermissions = Record<string, PermissionLevel>; // Key is the module name e.g., 'sales'

export type RolePermissions = Record<UserRole, ModulePermissions>;

// --- System Types ---
export interface BankAccount {
    bankName: string;
    accountName: string;
    accountNumber: string;
}
export interface CompanyInfo {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    taxId: string | null;
    logoUrl?: string | null;
    bankAccount: BankAccount | null;
}