
import React, { useState, useMemo, useEffect } from 'react';
import DataTable, { Column } from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import { SalesOrder, Customer, Product, OrderItem, CompanyInfo } from '../../types';
import { ICONS } from '../../constants';
import { generateOrderPdf, generateInvoicePdf } from '../../services/pdfService';
import { generateOrderDoc, generateInvoiceDoc } from '../../services/docService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Modal from '../../components/Modal';
import { supabase } from '../../supabase';
import Spinner from '../../components/Spinner';
import { useToast } from '../../contexts/ToastContext';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none border-b-2 ${
            active ? 'border-green-600 text-green-700 dark:text-green-400 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
    >
        {children}
    </button>
);

interface SalesManagementPageProps {
    companyInfo: CompanyInfo;
}

const defaultCustomerForm: Omit<Customer, 'id' | 'joinDate'> = {
    name: '', contactPerson: '', email: '', phone: '', address: '',
};

const defaultProductForm: Omit<Product, 'id'> = {
    name: '', product_code: null, category: 'ผลไม้', unitPrice: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 10,
};


const SalesManagementPage: React.FC<SalesManagementPageProps> = ({ companyInfo }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'crm' | 'inventory'>('overview');
    const [loading, setLoading] = useState(true);

    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    
    // Modal states
    const [isQuoteModalOpen, setQuoteModalOpen] = useState(false);
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [isViewOrderModalOpen, setViewOrderModalOpen] = useState(false);

    // Editing states
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
    
    // Form data states
    const [newQuote, setNewQuote] = useState<{ customerId: string; items: OrderItem[] }>({ customerId: '', items: [] });
    const [customerFormData, setCustomerFormData] = useState<Omit<Customer, 'id' | 'joinDate'>>(defaultCustomerForm);
    const [productFormData, setProductFormData] = useState<Omit<Product, 'id'>>(defaultProductForm);

    // Quote item selection
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    
    // Submitting states
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
    const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
    const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);


    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                ordersRes,
                customersRes,
                productsRes
            ] = await Promise.all([
                supabase.from('sales_orders').select('*, items:order_items(*)').order('orderDate', { ascending: false }),
                supabase.from('customers').select('*').order('joinDate', { ascending: false }),
                supabase.from('products').select('*').order('name', { ascending: true })
            ]);

            if (ordersRes.error) throw ordersRes.error;
            if (customersRes.error) throw customersRes.error;
            if (productsRes.error) throw productsRes.error;
            
            const processedOrders = (ordersRes.data || []).map(order => ({
                ...order,
                items: (order.items || []).map(item => ({
                    ...item,
                    total: (item.quantity ?? 0) * (item.unitPrice ?? 0)
                }))
            }));
            setOrders(processedOrders);
            setCustomers(customersRes.data || []);
            setProducts(productsRes.data || []);

            if (productsRes.data && productsRes.data.length > 0) {
                setSelectedProduct(productsRes.data[0].id);
            }

        } catch (error: any) {
            console.error("Error fetching sales data:", error);
            toast("ไม่สามารถดึงข้อมูลการขายได้: " + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [toast]);

    const handleExportPdf = (order: SalesOrder) => { generateOrderPdf(order, companyInfo); };
    const handleGenerateInvoicePdf = (order: SalesOrder) => { generateInvoicePdf(order, companyInfo); };
    const handleExportDoc = async (order: SalesOrder) => { await generateOrderDoc(order, companyInfo); };
    const handleGenerateInvoiceDoc = async (order: SalesOrder) => { await generateInvoiceDoc(order, companyInfo); };
    
    const analytics = useMemo(() => {
        const totalSales = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
        const totalCustomers = customers.length;
        const ordersToProcess = orders.filter(o => ['Pending', 'Processing'].includes(o.status ?? '')).length;
        const lowStockItems = products.filter(p => (p.stockQuantity ?? 0) < (p.lowStockThreshold ?? 0)).length;

        const salesByMonth = orders.filter(o => o.status !== 'Cancelled').reduce((acc, order) => {
            if (!order.orderDate) return acc;
            const month = new Date(order.orderDate).toLocaleString('th-TH', { month: 'short' });
            acc[month] = (acc[month] || 0) + (order.totalAmount ?? 0);
            return acc;
        }, {} as Record<string, number>);

        const salesByProduct = orders.flatMap(o => o.items).reduce((acc, item) => {
            acc[item.productName ?? ''] = (acc[item.productName ?? ''] || 0) + item.total;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalSales, totalCustomers, ordersToProcess, lowStockItems,
            salesByMonthData: Object.entries(salesByMonth).map(([name, sales]) => ({ name, sales })).reverse(),
            salesByProductData: Object.entries(salesByProduct).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
        };
    }, [orders, customers, products]);

    const COLORS = ['#4ade80', '#60a5fa', '#facc15', '#f87171', '#818cf8', '#fb923c'];

    const calculateTotal = (items: OrderItem[]): number => items.reduce((sum, item) => sum + item.total, 0);

    const handleAddItem = () => {
        const product = products.find(p => p.id === selectedProduct);
        if (!product || quantity <= 0) return;
        setNewQuote(currentQuote => {
            const existingItemIndex = currentQuote.items.findIndex(item => item.productId === product.id);
            let updatedItems: OrderItem[];
            const itemUnitPrice = product.unitPrice ?? 0;

            if (existingItemIndex > -1) {
                updatedItems = [...currentQuote.items];
                const currentItem = updatedItems[existingItemIndex];
                currentItem.quantity = (currentItem.quantity ?? 0) + quantity;
                currentItem.total = (currentItem.quantity || 0) * (currentItem.unitPrice || 0);
            } else {
                updatedItems = [...currentQuote.items, { 
                    productId: product.id, 
                    product_code: product.product_code, 
                    productName: product.name, 
                    quantity, 
                    unitPrice: itemUnitPrice, 
                    total: itemUnitPrice * quantity 
                }];
            }
            return { ...currentQuote, items: updatedItems };
        });
        setQuantity(1);
    };
    
    const handleRemoveItem = (index: number) => {
        const updatedItems = newQuote.items.filter((_, i) => i !== index);
        setNewQuote({ ...newQuote, items: updatedItems });
    };

    const handleSaveQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newQuote.customerId === '' || newQuote.items.length === 0) {
            toast("กรุณาเลือกลูกค้าและเพิ่มสินค้าอย่างน้อย 1 รายการ", 'error');
            return;
        }
        setIsSubmittingQuote(true);
        const customer = customers.find(c => c.id === newQuote.customerId);
        if (!customer) {
            toast("ไม่พบข้อมูลลูกค้าที่เลือก", "error");
            setIsSubmittingQuote(false);
            return;
        }

        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const datePrefix = `${year}-${month}-01`;

            const { count, error: countError } = await supabase
                .from('sales_orders')
                .select('*', { count: 'exact', head: true })
                .gte('orderDate', datePrefix);
            
            if (countError) throw countError;

            const newRunningNumber = (count || 0) + 1;
            const orderCode = `SO-${year}${month}-${newRunningNumber.toString().padStart(4, '0')}`;

            const newOrderPayload = {
                order_code: orderCode,
                customerId: newQuote.customerId,
                customerName: customer.name,
                orderDate: new Date().toISOString().split('T')[0],
                status: 'Quote' as const,
                totalAmount: calculateTotal(newQuote.items),
            };
            
            const { data: orderData, error: orderError } = await supabase.from('sales_orders').insert(newOrderPayload).select().single();

            if (orderError || !orderData) throw (orderError || new Error("Order creation failed"));

            const itemsToInsert = newQuote.items.map(item => ({
                order_id: orderData.id,
                productId: item.productId,
                productName: item.productName,
                product_code: item.product_code,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);

            if (itemsError) {
                await supabase.from('sales_orders').delete().eq('id', orderData.id); // Rollback
                throw itemsError;
            }
            
            toast('สร้างใบเสนอราคาสำเร็จ', 'success');
            setQuoteModalOpen(false);
            fetchData();
        } catch (error) {
            const err = error as any;
            console.error("Error creating quote:", err);
            let displayMessage = "ไม่สามารถสร้างใบเสนอราคาได้";
            if (err && typeof err === 'object') {
                if (err.code === '23503') { // Foreign key violation
                    displayMessage += ": ข้อมูลสินค้าหรือลูกค้าอาจไม่มีอยู่จริง";
                } else if (err.code === '23505') { // Unique constraint violation
                    displayMessage += ": รหัสใบเสนอราคานี้ถูกใช้งานแล้ว";
                } else if (err.message) {
                    displayMessage += `: ${err.message}`;
                } else {
                    displayMessage += ": เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
                }
            } else {
                displayMessage += `: ${String(err)}`;
            }
            toast(displayMessage, 'error');
        } finally {
            setIsSubmittingQuote(false);
        }
    };
    
    const openQuoteModal = () => {
        setNewQuote({ customerId: customers[0]?.id || '', items: [] });
        setSelectedProduct(products[0]?.id || '');
        setQuantity(1);
        setQuoteModalOpen(true);
    };

    const handleCloseCustomerModal = () => {
        setCustomerModalOpen(false);
        setEditingCustomer(null);
    };

    const handleOpenAddCustomerModal = () => {
        setEditingCustomer(null);
        setCustomerFormData(defaultCustomerForm);
        setCustomerModalOpen(true);
    };

    const handleOpenEditCustomerModal = (customer: Customer) => {
        setEditingCustomer(customer);
        const { id, joinDate, ...formData } = customer;
        setCustomerFormData(formData);
        setCustomerModalOpen(true);
    };
    
    const handleSaveCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerFormData.name || !customerFormData.contactPerson || !customerFormData.email) {
            toast("กรุณากรอกข้อมูลชื่อ, ผู้ติดต่อ และ Email", 'error');
            return;
        }
        setIsSubmittingCustomer(true);
        
        let error;

        if(editingCustomer) {
            const { error: updateError } = await supabase
                .from('customers')
                .update(customerFormData)
                .eq('id', editingCustomer.id);
            error = updateError;
        } else {
            const newCustomerData = {
                joinDate: new Date().toISOString().split('T')[0],
                ...customerFormData
            };
            const { error: insertError } = await supabase.from('customers').insert(newCustomerData);
            error = insertError;
        }

        if (error) {
            toast("ไม่สามารถบันทึกข้อมูลลูกค้าได้: " + error.message, 'error');
        } else {
            toast(editingCustomer ? 'แก้ไขข้อมูลลูกค้าสำเร็จ' : 'เพิ่มลูกค้าใหม่สำเร็จ', 'success');
            handleCloseCustomerModal();
            fetchData();
        }
        setIsSubmittingCustomer(false);
    };
    
    const handleCloseProductModal = () => { setProductModalOpen(false); setEditingProduct(null); };

    const handleOpenAddProductModal = () => {
        setEditingProduct(null);
        setProductFormData(defaultProductForm);
        setProductModalOpen(true);
    };

    const handleOpenEditProductModal = (product: Product) => {
        setEditingProduct(product);
        const { id, ...formData } = product;
        setProductFormData(formData);
        setProductModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productFormData.name || !productFormData.product_code || (productFormData.unitPrice ?? 0) <= 0) {
            toast("กรุณากรอกรหัสสินค้า, ชื่อสินค้า และราคาให้ถูกต้อง", 'error');
            return;
        }
        setIsSubmittingProduct(true);
        let error;
        if (editingProduct) {
            const { error: updateError } = await supabase.from('products').update(productFormData).eq('id', editingProduct.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('products').insert(productFormData);
            error = insertError;
        }
        
        if (error) {
            toast("ไม่สามารถบันทึกสินค้าได้: " + error.message, 'error');
        } else {
            toast(editingProduct ? 'แก้ไขข้อมูลสินค้าสำเร็จ' : 'เพิ่มสินค้าใหม่สำเร็จ', 'success');
            handleCloseProductModal();
            fetchData();
        }
        setIsSubmittingProduct(false);
    };

    const handleOpenViewOrderModal = (order: SalesOrder) => { setSelectedOrder(order); setViewOrderModalOpen(true); };
    const handleCloseViewOrderModal = () => { setViewOrderModalOpen(false); setSelectedOrder(null); };

    const handleUpdateOrderStatus = async (orderId: string, status: SalesOrder['status']) => {
        const { error } = await supabase.from('sales_orders').update({ status }).eq('id', orderId);
        if (error) {
            toast("ไม่สามารถอัปเดตสถานะได้: " + error.message, 'error');
        } else {
            toast('อัปเดตสถานะสำเร็จ', 'success');
            setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status });
            }
        }
    };

    const handlePrintOrder = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
              body * { visibility: hidden; }
              .no-print { display: none !important; }
              #order-details-printable, #order-details-printable * { visibility: visible; }
              #order-details-printable { 
                position: absolute; left: 0; top: 0; width: 100%; padding: 1rem;
                color: black !important; background: white !important;
                font-family: 'Chakra Petch', sans-serif;
              }
               /* override dark mode colors for printing */
              #order-details-printable .dark\\:bg-gray-800 { background-color: #fff !important; }
              #order-details-printable .dark\\:text-gray-100,
              #order-details-printable .dark\\:text-gray-200,
              #order-details-printable .dark\\:text-gray-300,
              #order-details-printable .dark\\:text-gray-700 { color: #000 !important; }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title="ยอดขายรวม" value={`฿${analytics.totalSales.toLocaleString()}`} color="bg-green-100 text-green-600" darkColor="dark:bg-green-900/50 dark:text-green-300" icon={ICONS.SALES} />
                 <StatCard title="ลูกค้าทั้งหมด" value={`${analytics.totalCustomers} ราย`} color="bg-blue-100 text-blue-600" darkColor="dark:bg-blue-900/50 dark:text-blue-300" icon={ICONS.HR} />
                 <StatCard title="ออเดอร์ที่ต้องจัดการ" value={`${analytics.ordersToProcess} รายการ`} color="bg-yellow-100 text-yellow-600" darkColor="dark:bg-yellow-900/50 dark:text-yellow-300" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>} />
                 <StatCard title="สินค้าใกล้หมดสต็อก" value={`${analytics.lowStockItems} ชนิด`} color="bg-red-100 text-red-600" darkColor="dark:bg-red-900/50 dark:text-red-300" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">วิเคราะห์ยอดขายรายเดือน</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={analytics.salesByMonthData}>
                             <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3}/>
                             <XAxis dataKey="name" tick={{ fill: '#a0a0a0' }}/>
                             <YAxis tick={{ fill: '#a0a0a0' }}/>
                             <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }} itemStyle={{ color: '#e5e7eb' }} />
                             <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                             <Bar dataKey="sales" name="ยอดขาย" fill="#4ade80" />
                         </BarChart>
                     </ResponsiveContainer>
                </div>
                 <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">5 สินค้าขายดี (ตามมูลค่า)</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={analytics.salesByProductData.slice(0,5)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {analytics.salesByProductData.slice(0,5).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                             <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }} itemStyle={{ color: '#e5e7eb' }}/>
                        </PieChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderOrders = () => {
        const columns: Column<SalesOrder>[] = [
            { header: 'รหัสสั่งซื้อ', accessor: 'order_code', className: 'font-medium text-gray-900 dark:text-gray-100' },
            { header: 'ลูกค้า', accessor: 'customerName' },
            { header: 'วันที่สั่งซื้อ', accessor: 'orderDate' },
            { header: 'ยอดรวม (บาท)', accessor: (item) => (item.totalAmount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), className: 'text-right' },
            { header: 'สถานะ', accessor: (item) => {
                const colors: Record<string, string> = { Quote: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', Processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', Shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', Delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
                return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[item.status ?? '']}`}>{item.status}</span>)
            }},
        ];
        const actions = (item: SalesOrder) => (
            <div className="flex flex-wrap items-center justify-end gap-2">
                <button onClick={() => handleOpenViewOrderModal(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium px-1">ดู/แก้ไข</button>
                <button onClick={() => handleGenerateInvoicePdf(item)} className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50 rounded-full transition-colors" title="ใบแจ้งหนี้ (PDF)"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2-2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button>
                <button onClick={() => handleExportPdf(item)} className="p-1 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 rounded-full transition-colors" title="ใบสั่งซื้อ (PDF)">{ICONS.PDF}</button>
                <button onClick={() => handleGenerateInvoiceDoc(item)} className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/50 rounded-full transition-colors" title="ใบแจ้งหนี้ (DOC)">{ICONS.DOC}</button>
                <button onClick={() => handleExportDoc(item)} className="p-1 text-red-700 hover:text-red-900 hover:bg-red-100 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/50 rounded-full transition-colors" title="ใบสั่งซื้อ (DOC)">{ICONS.DOC}</button>
            </div>
        );
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">รายการคำสั่งซื้อ</h2><button onClick={openQuoteModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">สร้างใบเสนอราคา</button></div>
                 <DataTable columns={columns} data={orders} actions={actions} />
            </div>
        );
    }
    
    const renderCrm = () => {
        const columns: Column<Customer>[] = [
            { header: 'ชื่อลูกค้า', accessor: 'name', className: 'font-medium text-gray-900 dark:text-gray-100' },
            { header: 'ผู้ติดต่อ', accessor: 'contactPerson' },
            { header: 'Email', accessor: 'email' },
            { header: 'เบอร์โทร', accessor: 'phone' },
            { header: 'วันที่เข้าร่วม', accessor: 'joinDate' },
        ];
        const customerActions = (item: Customer) => (
             <div className="flex items-center justify-end space-x-3">
                <button onClick={() => handleOpenEditCustomerModal(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">แก้ไข</button>
            </div>
        );

        return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ข้อมูลลูกค้า (CRM)</h2><button onClick={handleOpenAddCustomerModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">เพิ่มลูกค้าใหม่</button></div>
                <DataTable columns={columns} data={customers} actions={customerActions} />
            </div>
        )
    };
    
    const renderInventory = () => {
        const columns: Column<Product>[] = [
            { header: 'รหัสสินค้า', accessor: 'product_code', className: 'font-mono' },
            { header: 'ชื่อสินค้า', accessor: 'name', className: 'font-medium text-gray-900 dark:text-gray-100' },
            { header: 'หมวดหมู่', accessor: 'category' },
            { header: 'ราคา/หน่วย (บาท)', accessor: (item) => (item.unitPrice ?? 0).toLocaleString('th-TH'), className: 'text-right' },
            { header: 'จำนวนในสต็อก', accessor: (item) => (
                <div className="flex items-center justify-end space-x-2">
                     {(item.stockQuantity ?? 0) < (item.lowStockThreshold ?? 0) && (<span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Low Stock</span>)}
                    <span>{(item.stockQuantity ?? 0).toLocaleString()}</span>
                </div>
            ), className: 'text-right' },
        ];
        
        const productActions = (item: Product) => (
            <div className="flex items-center justify-end space-x-3"><button onClick={() => handleOpenEditProductModal(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">แก้ไข</button></div>
        );

        return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">สินค้าคงคลัง (พร้อมขาย)</h2><button onClick={handleOpenAddProductModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">เพิ่มสินค้าใหม่</button></div>
                <DataTable columns={columns} data={products} actions={productActions}/>
            </div>
        )
    };

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center p-10"><Spinner /></div>;
        }
        switch(activeTab) {
            case 'overview': return renderOverview();
            case 'orders': return renderOrders();
            case 'crm': return renderCrm();
            case 'inventory': return renderInventory();
            default: return null;
        }
    };

    return (
        <div className="space-y-4">
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
                 <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>ภาพรวม</TabButton>
                    <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>จัดการคำสั่งซื้อ</TabButton>
                    <TabButton active={activeTab === 'crm'} onClick={() => setActiveTab('crm')}>ลูกค้าสัมพันธ์ (CRM)</TabButton>
                    <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>สินค้าคงคลัง</TabButton>
                </div>
            </div>
            <div>
                {renderContent()}
            </div>
            
            <Modal title="สร้างใบเสนอราคาใหม่" isOpen={isQuoteModalOpen} onClose={() => setQuoteModalOpen(false)}>
                 <form onSubmit={handleSaveQuote} className="space-y-6">
                    <div>
                        <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ลูกค้า</label>
                        <select id="customer" value={newQuote.customerId} onChange={(e) => setNewQuote({ ...newQuote, customerId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm">
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">เพิ่มรายการสินค้า</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-3">
                                <label htmlFor="product" className="block text-sm font-medium text-gray-700 dark:text-gray-300">สินค้า</label>
                                <select id="product" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm">
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} - {(p.unitPrice ?? 0).toLocaleString()} บาท</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">จำนวน</label>
                                <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
                            </div>
                            <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 h-10">เพิ่ม</button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {newQuote.items.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">ยังไม่มีรายการสินค้า</p>
                        ) : (
                            newQuote.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded-md border dark:border-gray-600">
                                    <div><p className="font-medium text-gray-800 dark:text-gray-100">{item.productName}</p><p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} &times; {(item.unitPrice ?? 0).toLocaleString()} บาท</p></div>
                                    <div className="flex items-center space-x-4"><p className="font-semibold text-gray-800 dark:text-gray-100">{item.total.toLocaleString()} บาท</p><button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button></div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t dark:border-gray-700 pt-4">
                        <div className="flex justify-between items-center mb-4"><span className="text-lg font-bold text-gray-800 dark:text-gray-100">ยอดรวมสุทธิ</span><span className="text-2xl font-bold text-green-600 dark:text-green-400">฿{calculateTotal(newQuote.items).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-end space-x-2"><button type="button" onClick={() => setQuoteModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="submit" disabled={isSubmittingQuote} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex justify-center items-center min-w-[150px]">{isSubmittingQuote ? <Spinner/> : 'บันทึกใบเสนอราคา'}</button></div>
                    </div>
                </form>
            </Modal>
            
            <Modal title={editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"} isOpen={isCustomerModalOpen} onClose={handleCloseCustomerModal}>
                 <form onSubmit={handleSaveCustomer} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อลูกค้า/บริษัท</label><input type="text" placeholder="เช่น บริษัท ร่ำรวยการเกษตร จำกัด" value={customerFormData.name} onChange={e => setCustomerFormData({...customerFormData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ผู้ติดต่อ</label><input type="text" placeholder="คุณสมชาย" value={customerFormData.contactPerson ?? ''} onChange={e => setCustomerFormData({...customerFormData, contactPerson: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" placeholder="contact@example.com" value={customerFormData.email ?? ''} onChange={e => setCustomerFormData({...customerFormData, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" required /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เบอร์โทร</label><input type="tel" placeholder="081-234-5678" value={customerFormData.phone ?? ''} onChange={e => setCustomerFormData({...customerFormData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ที่อยู่ (ถ้ามี)</label><input type="text" placeholder="123 หมู่ 1 ต.บางพลี อ.เมือง จ.สมุทรปราการ" value={customerFormData.address ?? ''} onChange={e => setCustomerFormData({...customerFormData, address: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" /></div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseCustomerModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button type="submit" disabled={isSubmittingCustomer} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex justify-center items-center min-w-[150px]">
                            {isSubmittingCustomer ? <Spinner/> : (editingCustomer ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลลูกค้า')}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal title={editingProduct ? "แก้ไขข้อมูลสินค้า" : "เพิ่มสินค้าใหม่"} isOpen={isProductModalOpen} onClose={handleCloseProductModal}>
                <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รหัสสินค้า</label>
                            <input type="text" placeholder="เช่น FR-001" value={productFormData.product_code ?? ''} onChange={e => setProductFormData({...productFormData, product_code: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อสินค้า</label>
                            <input type="text" placeholder="เช่น มะม่วงน้ำดอกไม้" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">หมวดหมู่</label><select value={productFormData.category ?? ''} onChange={e => setProductFormData({...productFormData, category: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500"><option>ผลไม้</option><option>ผัก</option><option>แปรรูป</option><option>อื่นๆ</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ราคาขาย/หน่วย (บาท)</label><input type="number" placeholder="100" min="0" value={productFormData.unitPrice ?? ''} onChange={e => setProductFormData({...productFormData, unitPrice: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" required /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ราคาทุน/หน่วย (บาท)</label><input type="number" placeholder="60" min="0" value={productFormData.costPrice ?? ''} onChange={e => setProductFormData({...productFormData, costPrice: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">จำนวนในสต็อก</label><input type="number" placeholder="250" min="0" value={productFormData.stockQuantity ?? ''} onChange={e => setProductFormData({...productFormData, stockQuantity: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" /></div>
                    </div>
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">จุดแจ้งเตือนสต็อกต่ำ</label><input type="number" placeholder="50" min="0" value={productFormData.lowStockThreshold ?? ''} onChange={e => setProductFormData({...productFormData, lowStockThreshold: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" /></div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseProductModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button type="submit" disabled={isSubmittingProduct} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex justify-center items-center min-w-[120px]">
                            {isSubmittingProduct ? <Spinner/> : (editingProduct ? 'บันทึกการแก้ไข' : 'บันทึกสินค้า')}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal title={`รายละเอียดคำสั่งซื้อ #${selectedOrder?.order_code}`} isOpen={isViewOrderModalOpen} onClose={handleCloseViewOrderModal}>
                {selectedOrder && (
                    <>
                        <div id="order-details-printable" className="space-y-4">
                            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">รายละเอียดคำสั่งซื้อ</h3>
                            <p className="text-center text-gray-600 dark:text-gray-300">#{selectedOrder.order_code}</p>

                            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t dark:border-gray-700">
                                <div><p className="font-semibold text-gray-700 dark:text-gray-300">ลูกค้า:</p><p className="text-gray-800 dark:text-gray-100">{selectedOrder.customerName}</p></div>
                                <div><p className="font-semibold text-gray-700 dark:text-gray-300">วันที่สั่งซื้อ:</p><p className="text-gray-800 dark:text-gray-100">{selectedOrder.orderDate}</p></div>
                            </div>
                            <div className="border-t border-b dark:border-gray-700 py-2">
                                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">รายการสินค้า</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm">
                                            <div className="flex-grow"><p className="font-medium text-gray-800 dark:text-gray-200">{item.productName}</p><p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} x {(item.unitPrice ?? 0).toLocaleString()} บาท</p></div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100 w-24 text-right">{item.total.toLocaleString()} บาท</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end items-center"><p className="text-md font-bold mr-4 text-gray-800 dark:text-gray-100">ยอดรวมสุทธิ:</p><p className="text-xl font-bold text-green-600 dark:text-green-400">฿{(selectedOrder.totalAmount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p></div>
                        </div>
                        <div className="border-t pt-4 mt-4 dark:border-gray-700 no-print">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เปลี่ยนสถานะคำสั่งซื้อ</label>
                            <div className="flex items-center space-x-2 mt-1">
                                <select value={selectedOrder.status ?? ''} onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value as SalesOrder['status'])} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm">
                                    <option value="Quote">Quote</option><option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-between no-print">
                            <button type="button" onClick={handlePrintOrder} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                พิมพ์
                            </button>
                            <button type="button" onClick={handleCloseViewOrderModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ปิด</button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default SalesManagementPage;
