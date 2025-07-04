

import { createClient } from '@supabase/supabase-js';
import { 
    CompanyInfo, Employee, Customer, Product, SalesOrderRecord, FinancialTransaction, 
    Plot, FarmActivity, Asset, Receivable, Payable, InvestmentProject, RiskItem, User,
    PlotStatus, ActivityType, ActivityStatus, PaymentStatus, InvestmentStatus, RiskCategory,
    RiskLevel, RiskStatus, UserRole, BankAccount, OrderItemRow,
    IoTDevice
} from './types';

export interface Database {
  public: {
    Tables: {
      company_info: {
        Row: CompanyInfo;
        Insert: Partial<CompanyInfo>;
        Update: Partial<CompanyInfo>;
      };
      employees: {
        Row: Employee;
        Insert: Partial<Employee>;
        Update: Partial<Employee>;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Customer>;
        Update: Partial<Customer>;
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
      };
      sales_orders: {
        Row: SalesOrderRecord;
        Insert: Partial<SalesOrderRecord>;
        Update: Partial<SalesOrderRecord>;
      };
      order_items: {
        Row: OrderItemRow;
        Insert: Partial<OrderItemRow>;
        Update: Partial<OrderItemRow>;
      };
      financial_transactions: {
        Row: FinancialTransaction;
        Insert: Partial<FinancialTransaction>;
        Update: Partial<FinancialTransaction>;
      };
      plots: {
        Row: Plot;
        Insert: Partial<Plot>;
        Update: Partial<Plot>;
      };
      farm_activities: {
        Row: FarmActivity;
        Insert: Partial<FarmActivity>;
        Update: Partial<FarmActivity>;
      };
      assets: {
        Row: Asset;
        Insert: Partial<Asset>;
        Update: Partial<Asset>;
      };
      receivables: {
        Row: Receivable;
        Insert: Partial<Receivable>;
        Update: Partial<Receivable>;
      };
      payables: {
        Row: Payable;
        Insert: Partial<Payable>;
        Update: Partial<Payable>;
      };
      investment_projects: {
        Row: InvestmentProject;
        Insert: Partial<InvestmentProject>;
        Update: Partial<InvestmentProject>;
      };
      risk_items: {
        Row: RiskItem;
        Insert: Partial<RiskItem>;
        Update: Partial<RiskItem>;
      };
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
      };
      iot_devices: {
        Row: IoTDevice;
        Insert: Partial<IoTDevice>;
        Update: Partial<IoTDevice>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}


// NOTE: In a production environment, these keys should be stored securely as environment variables.
// They are hardcoded here to resolve the configuration error based on the user's request.
const supabaseUrl = 'https://ddinchnrtmuvanpmroxm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaW5jaG5ydG11dmFucG1yb3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MzQ2MzgsImV4cCI6MjA2NzIxMDYzOH0.xCa9xXTeS2LwJnpQA1ZQ8ZSqBV7lc_IILHb_BNXFFec';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);