
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AppDatabase {
  public: {
    Tables: {
      assets: {
        Row: {
          depreciationMethod: string | null
          id: string
          name: string | null
          purchaseCost: number | null
          purchaseDate: string | null
          salvageValue: number | null
          status: "ใช้งาน" | "ซ่อมบำรุง" | "จำหน่ายแล้ว" | null
          usefulLife: number | null
        }
        Insert: {
          depreciationMethod?: string | null
          id?: string
          name?: string | null
          purchaseCost?: number | null
          purchaseDate?: string | null
          salvageValue?: number | null
          status?: "ใช้งาน" | "ซ่อมบำรุง" | "จำหน่ายแล้ว" | null
          usefulLife?: number | null
        }
        Update: {
          depreciationMethod?: string | null
          id?: string
          name?: string | null
          purchaseCost?: number | null
          purchaseDate?: string | null
          salvageValue?: number | null
          status?: "ใช้งาน" | "ซ่อมบำรุง" | "จำหน่ายแล้ว" | null
          usefulLife?: number | null
        }
        Relationships: []
      }
      company_info: {
        Row: {
          address: string | null
          bankAccount: Json | null
          email: string | null
          id: number
          logoUrl: string | null
          name: string
          phone: string | null
          taxId: string | null
        }
        Insert: {
          address?: string | null
          bankAccount?: Json | null
          email?: string | null
          id?: number
          logoUrl?: string | null
          name: string
          phone?: string | null
          taxId?: string | null
        }
        Update: {
          address?: string | null
          bankAccount?: Json | null
          email?: string | null
          id?: number
          logoUrl?: string | null
          name?: string
          phone?: string | null
          taxId?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          contactPerson: string | null
          email: string | null
          id: string
          joinDate: string | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          contactPerson?: string | null
          email?: string | null
          id?: string
          joinDate?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          contactPerson?: string | null
          email?: string | null
          id?: string
          joinDate?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          age: number | null
          dob: string | null
          id: string
          idCard: string | null
          name: string
          nickname: string | null
          phone: string | null
          position: string | null
          salary: number | null
          startDate: string | null
          status: "Active" | "Inactive" | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          dob?: string | null
          id?: string
          idCard?: string | null
          name: string
          nickname?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          startDate?: string | null
          status?: "Active" | "Inactive" | null
        }
        Update: {
          address?: string | null
          age?: number | null
          dob?: string | null
          id?: string
          idCard?: string | null
          name?: string
          nickname?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          startDate?: string | null
          status?: "Active" | "Inactive" | null
        }
        Relationships: []
      }
      farm_activities: {
        Row: {
          activityType: "เตรียมดิน" | "ปลูก" | "ใส่ปุ๋ย" | "รดน้ำ" | "กำจัดวัชพืช" | "เก็บเกี่ยว" | null
          assignedTo: string | null
          date: string | null
          id: string
          plotId: string | null
          plotName: string | null
          status: "วางแผน" | "กำลังดำเนินการ" | "เสร็จสิ้น" | null
        }
        Insert: {
          activityType?: "เตรียมดิน" | "ปลูก" | "ใส่ปุ๋ย" | "รดน้ำ" | "กำจัดวัชพืช" | "เก็บเกี่ยว" | null
          assignedTo?: string | null
          date?: string | null
          id?: string
          plotId?: string | null
          plotName?: string | null
          status?: "วางแผน" | "กำลังดำเนินการ" | "เสร็จสิ้น" | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_activities_plotId_fkey"
            columns: ["plotId"]
            referencedRelation: "plots"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_transactions: {
        Row: {
          amount: number | null
          category: string | null
          date: string | null
          description: string | null
          id: string
          type: "Income" | "Expense" | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          date?: string | null
          description?: string | null
          id?: string
          type?: "Income" | "Expense" | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          date?: string | null
          description?: string | null
          id?: string
          type?: "Income" | "Expense" | null
        }
        Relationships: []
      }
      investment_projects: {
        Row: {
          description: string | null
          expectedRevenue: number | null
          id: string
          investmentCost: number | null
          name: string | null
          status: "วางแผน" | "อนุมัติแล้ว" | "กำลังดำเนินการ" | "เสร็จสิ้น" | null
        }
        Insert: {
          description?: string | null
          expectedRevenue?: number | null
          id?: string
          investmentCost?: number | null
          name?: string | null
          status?: "วางแผน" | "อนุมัติแล้ว" | "กำลังดำเนินการ" | "เสร็จสิ้น" | null
        }
        Update: {
          description?: string | null
          expectedRevenue?: number | null
          id?: string
          investmentCost?: number | null
          name?: string | null
          status?: "วางแผน" | "อนุมัติแล้ว" | "กำลังดำเนินการ" | "เสร็จสิ้น" | null
        }
        Relationships: []
      }
      iot_devices: {
        Row: {
          device_id: string
          id: string
          last_heartbeat: string | null
          name: string | null
          plot_id: string | null
          sensor_type: string | null
          status: "Online" | "Offline" | "Needs Setup" | null
        }
        Insert: {
          device_id: string
          id?: string
          last_heartbeat?: string | null
          name?: string | null
          plot_id?: string | null
          sensor_type?: string | null
          status?: "Online" | "Offline" | "Needs Setup" | null
        }
        Update: {
          device_id?: string
          id?: string
          last_heartbeat?: string | null
          name?: string | null
          plot_id?: string | null
          sensor_type?: string | null
          status?: "Online" | "Offline" | "Needs Setup" | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_devices_plot_id_fkey"
            columns: ["plot_id"]
            referencedRelation: "plots"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: number
          order_id: string
          productId: string
          productName: string | null
          product_code: string | null
          quantity: number | null
          unitPrice: number | null
        }
        Insert: {
          id?: number
          order_id: string
          productId: string
          productName?: string | null
          product_code?: string | null
          quantity?: number | null
          unitPrice?: number | null
        }
        Update: {
          id?: number
          order_id?: string
          productId?: string
          productName?: string | null
          product_code?: string | null
          quantity?: number | null
          unitPrice?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_productId_fkey"
            columns: ["productId"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      payables: {
        Row: {
          amount: number | null
          dueDate: string | null
          id: string
          invoiceId: string | null
          issueDate: string | null
          status: "ค้างชำระ" | "ชำระแล้ว" | "ค้างจ่าย" | "จ่ายแล้ว" | null
          vendorName: string | null
        }
        Insert: {
          amount?: number | null
          dueDate?: string | null
          id?: string
          invoiceId?: string | null
          issueDate?: string | null
          status?: "ค้างชำระ" | "ชำระแล้ว" | "ค้างจ่าย" | "จ่ายแล้ว" | null
          vendorName?: string | null
        }
        Update: {
          amount?: number | null
          dueDate?: string | null
          id?: string
          invoiceId?: string | null
          issueDate?: string | null
          status?: "ค้างชำระ" | "ชำระแล้ว" | "ค้างจ่าย" | "จ่ายแล้ว" | null
          vendorName?: string | null
        }
        Relationships: []
      }
      plots: {
        Row: {
          crop: string | null
          expectedHarvestDate: string | null
          id: string
          name: string | null
          plantingDate: string | null
          size: number | null
          status: "ว่าง" | "เตรียมดิน" | "กำลังเติบโต" | "พร้อมเก็บเกี่ยว" | "เก็บเกี่ยวแล้ว" | null
        }
        Insert: {
          crop?: string | null
          expectedHarvestDate?: string | null
          id?: string
          name?: string | null
          plantingDate?: string | null
          size?: number | null
          status?: "ว่าง" | "เตรียมดิน" | "กำลังเติบโต" | "พร้อมเก็บเกี่ยว" | "เก็บเกี่ยวแล้ว" | null
        }
        Update: {
          crop?: string | null
          expectedHarvestDate?: string | null
          id?: string
          name?: string | null
          plantingDate?: string | null
          size?: number | null
          status?: "ว่าง" | "เตรียมดิน" | "กำลังเติบโต" | "พร้อมเก็บเกี่ยว" | "เก็บเกี่ยวแล้ว" | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          costPrice: number | null
          id: string
          lowStockThreshold: number | null
          name: string
          product_code: string | null
          stockQuantity: number | null
          unitPrice: number | null
        }
        Insert: {
          category?: string | null
          costPrice?: number | null
          id?: string
          lowStockThreshold?: number | null
          name: string
          product_code?: string | null
          stockQuantity?: number | null
          unitPrice?: number | null
        }
        Update: {
          category?: string | null
          costPrice?: number | null
          id?: string
          lowStockThreshold?: number | null
          name?: string
          product_code?: string | null
          stockQuantity?: number | null
          unitPrice?: number | null
        }
        Relationships: []
      }
      receivables: {
        Row: {
          amount: number | null
          customerName: string | null
          dueDate: string | null
          id: string
          invoiceId: string | null
          issueDate: string | null
          status: "ค้างชำระ" | "ชำระแล้ว" | "ค้างจ่าย" | "จ่ายแล้ว" | null
        }
        Insert: {
          amount?: number | null
          customerName?: string | null
          dueDate?: string | null
          id?: string
          invoiceId?: string | null
          issueDate?: string | null
          status?: "ค้างชำระ" | "ชำระแล้ว" | "ค้างจ่าย" | "จ่ายแล้ว" | null
        }
        Update: {
          amount?: number | null
          customerName?: string | null
          dueDate?: string | null
          id?: string
          invoiceId?: string | null
          issueDate?: string | null
          status?: "ค้างชำระ" | "ชำระแล้ว" | "ค้างจ่าย" | "จ่ายแล้ว" | null
        }
        Relationships: []
      }
      risk_items: {
        Row: {
          category: "ภัยธรรมชาติ" | "โรคระบาด" | "ราคาตลาด" | "การดำเนินงาน" | null
          id: string
          impact: "ต่ำ" | "ปานกลาง" | "สูง" | null
          likelihood: "ต่ำ" | "ปานกลาง" | "สูง" | null
          mitigationPlan: string | null
          riskName: string | null
          status: "ระบุแล้ว" | "กำลังจัดการ" | "จัดการแล้ว" | "เกิดขึ้นจริง" | null
        }
        Insert: {
          category?: "ภัยธรรมชาติ" | "โรคระบาด" | "ราคาตลาด" | "การดำเนินงาน" | null
          id?: string
          impact?: "ต่ำ" | "ปานกลาง" | "สูง" | null
          likelihood?: "ต่ำ" | "ปานกลาง" | "สูง" | null
          mitigationPlan?: string | null
          riskName?: string | null
          status?: "ระบุแล้ว" | "กำลังจัดการ" | "จัดการแล้ว" | "เกิดขึ้นจริง" | null
        }
        Update: {
          category?: "ภัยธรรมชาติ" | "โรคระบาด" | "ราคาตลาด" | "การดำเนินงาน" | null
          id?: string
          impact?: "ต่ำ" | "ปานกลาง" | "สูง" | null
          likelihood?: "ต่ำ" | "ปานกลาง" | "สูง" | null
          mitigationPlan?: string | null
          riskName?: string | null
          status?: "ระบุแล้ว" | "กำลังจัดการ" | "จัดการแล้ว" | "เกิดขึ้นจริง" | null
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          customerId: string | null
          customerName: string | null
          id: string
          orderDate: string | null
          order_code: string
          status: "Quote" | "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | null
          totalAmount: number | null
        }
        Insert: {
          customerId?: string | null
          customerName?: string | null
          id?: string
          orderDate?: string | null
          order_code: string
          status?: "Quote" | "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | null
          totalAmount?: number | null
        }
        Update: {
          customerId?: string | null
          customerName?: string | null
          id?: string
          orderDate?: string | null
          order_code?: string
          status?: "Quote" | "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | null
          totalAmount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customerId_fkey"
            columns: ["customerId"]
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      supply_items: {
        Row: {
          category: "ปุ๋ย" | "ยาฆ่าแมลง" | "เมล็ดพันธุ์" | "เครื่องมือ" | "อื่นๆ" | null
          id: string
          last_updated: string
          name: string
          quantity: number | null
          reorder_level: number | null
          supplier: string | null
          unit: "กิโลกรัม" | "ลิตร" | "ถุง" | "ชิ้น" | "ขวด" | null
          unit_price: number | null
        }
        Insert: {
          category?: "ปุ๋ย" | "ยาฆ่าแมลง" | "เมล็ดพันธุ์" | "เครื่องมือ" | "อื่นๆ" | null
          id?: string
          last_updated?: string
          name: string
          quantity?: number | null
          reorder_level?: number | null
          supplier?: string | null
          unit?: "กิโลกรัม" | "ลิตร" | "ถุง" | "ชิ้น" | "ขวด" | null
          unit_price?: number | null
        }
        Update: {
          category?: "ปุ๋ย" | "ยาฆ่าแมลง" | "เมล็ดพันธุ์" | "เครื่องมือ" | "อื่นๆ" | null
          id?: string
          last_updated?: string
          name?: string
          quantity?: number | null
          reorder_level?: number | null
          supplier?: string | null
          unit?: "กิโลกรัม" | "ลิตร" | "ถุง" | "ชิ้น" | "ขวด" | null
          unit_price?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatarUrl: string | null
          email: string | null
          id: string
          name: string | null
          role: "Admin" | "Farm Manager" | "Accountant" | "Sales" | "Worker" | null
          status: "Active" | "Inactive" | null
        }
        Insert: {
          avatarUrl?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: "Admin" | "Farm Manager" | "Accountant" | "Sales" | "Worker" | null
          status?: "Active" | "Inactive" | null
        }
        Update: {
          avatarUrl?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: "Admin" | "Farm Manager" | "Accountant" | "Sales" | "Worker" | null
          status?: "Active" | "Inactive" | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_all_data: {
        Args: {
          admin_email: string
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_status: "วางแผน" | "กำลังดำเนินการ" | "เสร็จสิ้น"
      activity_type:
        | "เตรียมดิน"
        | "ปลูก"
        | "ใส่ปุ๋ย"
        | "รดน้ำ"
        | "กำจัดวัชพืช"
        | "เก็บเกี่ยว"
      asset_status: "ใช้งาน" | "ซ่อมบำรุง" | "จำหน่ายแล้ว"
      device_status: "Online" | "Offline" | "Needs Setup"
      employee_status: "Active" | "Inactive"
      investment_status: "วางแผน" | "อนุมัติแล้ว" | "กำลังดำเนินการ" | "เสร็จสิ้น"
      order_status:
        | "Quote"
        | "Pending"
        | "Processing"
        | "Shipped"
        | "Delivered"
        | "Cancelled"
      payment_status: "ค้างชำระ" | "ชำระแล้ว" | "ค้างจ่าย" | "จ่ายแล้ว"
      plot_status:
        | "ว่าง"
        | "เตรียมดิน"
        | "กำลังเติบโต"
        | "พร้อมเก็บเกี่ยว"
        | "เก็บเกี่ยวแล้ว"
      risk_category: "ภัยธรรมชาติ" | "โรคระบาด" | "ราคาตลาด" | "การดำเนินงาน"
      risk_level: "ต่ำ" | "ปานกลาง" | "สูง"
      risk_status: "ระบุแล้ว" | "กำลังจัดการ" | "จัดการแล้ว" | "เกิดขึ้นจริง"
      supply_category: "ปุ๋ย" | "ยาฆ่าแมลง" | "เมล็ดพันธุ์" | "เครื่องมือ" | "อื่นๆ"
      supply_unit: "กิโลกรัม" | "ลิตร" | "ถุง" | "ชิ้น" | "ขวด"
      transaction_type: "Income" | "Expense"
      user_role: "Admin" | "Farm Manager" | "Accountant" | "Sales" | "Worker"
      user_status: "Active" | "Inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
