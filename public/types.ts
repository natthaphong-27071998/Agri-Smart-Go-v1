
import { AppDatabase as DB } from './supabase-types';

export type UserRole = 'Admin' | 'Farm Manager' | 'Accountant' | 'Sales' | 'Worker';
export type PlotStatus = 'ว่าง' | 'เตรียมดิน' | 'กำลังเติบโต' | 'พร้อมเก็บเกี่ยว' | 'เก็บเกี่ยวแล้ว';
export type ActivityType = 'เตรียมดิน' | 'ปลูก' | 'ใส่ปุ๋ย' | 'รดน้ำ' | 'กำจัดวัชพืช' | 'เก็บเกี่ยว';
export type ActivityStatus = 'วางแผน' | 'กำลังดำเนินการ' | 'เสร็จสิ้น';
export type DeviceStatus = 'Online' | 'Offline' | 'Needs Setup';
export type PaymentStatus = 'ค้างชำระ' | 'ชำระแล้ว' | 'ค้างจ่าย' | 'จ่ายแล้ว';
export type InvestmentStatus = 'วางแผน' | 'อนุมัติแล้ว' | 'กำลังดำเนินการ' | 'เสร็จสิ้น';
export type RiskLevel = 'ต่ำ' | 'ปานกลาง' | 'สูง';
export type RiskCategory = 'ภัยธรรมชาติ' | 'โรคระบาด' | 'ราคาตลาด' | 'การดำเนินงาน';
export type RiskStatus = 'ระบุแล้ว' | 'กำลังจัดการ' | 'จัดการแล้ว' | 'เกิดขึ้นจริง';
export type SupplyCategory = 'ปุ๋ย' | 'ยาฆ่าแมลง' | 'เมล็ดพันธุ์' | 'เครื่องมือ' | 'อื่นๆ';
export type SupplyUnit = 'กิโลกรัม' | 'ลิตร' | 'ถุง' | 'ชิ้น' | 'ขวด';

export type Employee = DB['public']['Tables']['employees']['Row'];
export type Customer = DB['public']['Tables']['customers']['Row'];
export type Product = DB['public']['Tables']['products']['Row'];
export type SalesOrderRecord = DB['public']['Tables']['sales_orders']['Row'];
export type OrderItemRow = DB['public']['Tables']['order_items']['Row'];
export type FinancialTransaction = DB['public']['Tables']['financial_transactions']['Row'];
export type User = DB['public']['Tables']['users']['Row'];
export type Plot = DB['public']['Tables']['plots']['Row'];
export type FarmActivity = DB['public']['Tables']['farm_activities']['Row'];
export type IoTDevice = DB['public']['Tables']['iot_devices']['Row'];
export type Asset = DB['public']['Tables']['assets']['Row'];
export type Receivable = DB['public']['Tables']['receivables']['Row'];
export type Payable = DB['public']['Tables']['payables']['Row'];
export type InvestmentProject = DB['public']['Tables']['investment_projects']['Row'];
export type RiskItem = DB['public']['Tables']['risk_items']['Row'];
export type CompanyInfo = DB['public']['Tables']['company_info']['Row'];
export type BankAccount = CompanyInfo['bankAccount'];
export type SupplyItem = DB['public']['Tables']['supply_items']['Row'];


export interface BankAccountInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface SalesOrder extends SalesOrderRecord {
  items: OrderItem[];
}

export interface OrderItem {
    productId: string;
    product_code: string | null;
    productName: string | null;
    quantity: number | null;
    unitPrice: number | null;
    total: number;
}


// --- Permission Management Types ---
export type AppModuleKey = 'dashboard' | 'production' | 'hr' | 'accounting' | 'sales' | 'investment' | 'reports' | 'admin' | 'inventory';

export interface PermissionLevel {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type ModulePermissions = Record<AppModuleKey, PermissionLevel>; // Key is the module name e.g., 'sales'

export type RolePermissions = Record<UserRole, ModulePermissions>;

// Re-export the main database type for clarity if needed elsewhere
export type AppDatabase = DB;
