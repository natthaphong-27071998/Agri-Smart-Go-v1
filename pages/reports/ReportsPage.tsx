

import React, { useState } from 'react';
import { SalesOrder, FinancialTransaction, Employee, Plot, Product, SalesOrderRecord, OrderItemRow } from '../../types';
import DataTable, { Column } from '../../components/DataTable';
import { supabase } from '../../supabase';
import Spinner from '../../components/Spinner';

interface ProductProfitReportItem {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
}

const reportGroups = [
  {
    label: 'รายงานด้านการขาย',
    options: [
      { value: 'sales_summary', label: 'สรุปยอดขาย (ตามช่วงเวลา)', requiresDate: true },
      { value: 'sales_by_customer', label: 'สรุปยอดขาย (ตามลูกค้า)', requiresDate: true },
      { value: 'top_profit_products', label: 'วิเคราะห์สินค้าทำกำไรสูงสุด', requiresDate: true },
    ]
  },
  {
    label: 'รายงานด้านการผลิต',
    options: [
        { value: 'plot_production', label: 'รายงานต้นทุนและประสิทธิภาพการผลิต', requiresDate: false },
    ]
  },
  {
    label: 'รายงานด้านการเงิน',
    options: [
      { value: 'pnl_statement', label: 'งบกำไรขาดทุน', requiresDate: true },
      { value: 'balance_sheet', label: 'งบดุล (ตัวอย่าง)', requiresDate: false },
    ]
  },
  {
    label: 'รายงานด้านบุคลากร',
    options: [
      { value: 'active_employees', label: 'รายชื่อพนักงานที่ใช้งานอยู่', requiresDate: false },
      { value: 'payroll_summary', label: 'สรุปการจ่ายเงินเดือน', requiresDate: false },
    ]
  }
];
const allReportOptions = reportGroups.flatMap(g => g.options);

const ReportsPage: React.FC = () => {
    const [reportType, setReportType] = useState('');
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportContent, setReportContent] = useState<React.ReactNode | null>(null);
    const [reportTitle, setReportTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const [reportDataForExport, setReportDataForExport] = useState<any[]>([]);
    const [reportColumnsForExport, setReportColumnsForExport] = useState<Column<any>[]>([]);
    const [isExportable, setIsExportable] = useState(false);


    const handlePrint = () => { window.print(); };

    const handleExportPdf = () => {
        if (!isExportable) return;
        const doc = new (window as any).jspdf.jsPDF();
        
        const head = [reportColumnsForExport.map(c => c.header)];
        const body = reportDataForExport.map(row => 
            reportColumnsForExport.map(col => {
                if (typeof col.accessor === 'function') {
                    const node = col.accessor(row);
                    if (React.isValidElement(node)) {
                        const children = React.Children.toArray((node as any).props.children);
                        return children.map(child => (typeof child === 'string' || typeof child === 'number') ? child : '').join(' ');
                    }
                    return String(node);
                }
                return String(row[col.accessor as keyof any]);
            })
        );
        
        doc.text(reportTitle, 14, 15);
        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 20,
        });

        doc.save(`${reportTitle.replace(/[\s/]/g, '_')}.pdf`);
    };

    const handleExportCsv = () => {
        if (!isExportable) return;

        const headers = reportColumnsForExport.map(c => `"${c.header}"`).join(',');
        const rows = reportDataForExport.map(row => 
            reportColumnsForExport.map(col => {
                let value;
                if (typeof col.accessor === 'function') {
                    const node = col.accessor(row);
                     if (React.isValidElement(node)) {
                        const children = React.Children.toArray((node as any).props.children);
                        value = children.map(child => (typeof child === 'string' || typeof child === 'number') ? child : '').join(' ');
                    } else {
                        value = node;
                    }
                } else {
                    value = row[col.accessor as keyof any];
                }
                const stringValue = String(value).replace(/"/g, '""');
                return `"${stringValue}"`;
            }).join(',')
        ).join('\n');

        const csvContent = `data:text/csv;charset=utf-8,\uFEFF${headers}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${reportTitle.replace(/[\s/]/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setReportContent(null);
        setReportDataForExport([]);
        setReportColumnsForExport([]);
        setIsExportable(false);
        
        const selectedOption = allReportOptions.find(opt => opt.value === reportType);
        if (!selectedOption) {
            setReportContent(<p className="text-center text-gray-500">กรุณาเลือกประเภทรายงาน</p>);
            setReportTitle('');
            setLoading(false);
            return;
        }

        setReportTitle(selectedOption.label);
        
        try {
            switch (reportType) {
                case 'sales_summary': {
                    const { data, error } = await supabase.from('sales_orders').select('*').gte('orderDate', startDate).lte('orderDate', endDate).neq('status', 'Cancelled');
                    if(error) throw error;
                    const reportData = (data || []).map(o => ({...o, items: []}));
                    const salesColumns: Column<SalesOrder>[] = [
                        { header: 'วันที่', accessor: 'orderDate' },
                        { header: 'ลูกค้า', accessor: 'customerName' },
                        { header: 'ยอดรวม (บาท)', accessor: item => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(item.totalAmount ?? 0), className: 'text-right' }
                    ];
                    const total = reportData.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
                    setReportContent(
                        <><h3 className="font-semibold mb-4">ข้อมูลยอดขายระหว่างวันที่ {startDate} ถึง {endDate}</h3><DataTable columns={salesColumns} data={reportData} /><p className="text-right font-bold text-lg mt-4">ยอดรวมทั้งหมด: {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(total)} บาท</p></>
                    );
                    setReportDataForExport(reportData); setReportColumnsForExport(salesColumns); setIsExportable(true);
                    break;
                }
                case 'sales_by_customer': {
                    const { data, error } = await supabase.from('sales_orders').select('customerName, totalAmount').gte('orderDate', startDate).lte('orderDate', endDate).neq('status', 'Cancelled');
                    if(error) throw error;
                    const salesByCustomer = data.reduce((acc, order) => {
                        if (order.customerName) {
                           acc[order.customerName] = (acc[order.customerName] || 0) + Number(order.totalAmount || 0);
                        }
                        return acc;
                    }, {} as Record<string, number>);
                    const reportData = Object.entries(salesByCustomer).map(([name, total]) => ({ id: name, name, total })).sort((a,b) => b.total - a.total);
                    const columns: Column<typeof reportData[0]>[] = [
                        { header: 'ลูกค้า', accessor: 'name' },
                        { header: 'ยอดขายรวม (บาท)', accessor: item => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(item.total), className: 'text-right' },
                    ];
                    setReportContent(<><h3 className="font-semibold mb-4">สรุปยอดขายตามลูกค้าระหว่างวันที่ {startDate} ถึง {endDate}</h3><DataTable columns={columns} data={reportData} /></>);
                    setReportDataForExport(reportData); setReportColumnsForExport(columns); setIsExportable(true);
                    break;
                }
                 case 'top_profit_products': {
                    const { data: ordersData, error: orderError } = await supabase.from('sales_orders').select('*, items:order_items(*)').gte('orderDate', startDate).lte('orderDate', endDate).neq('status', 'Cancelled');
                    const { data: productsData, error: productError } = await supabase.from('products').select('id, costPrice');
                    if (orderError || productError) throw orderError || productError;
                    
                    const orders = ordersData as (SalesOrderRecord & { items: OrderItemRow[] })[] | null;
                    const products = productsData as Pick<Product, 'id' | 'costPrice'>[] | null;

                    const initialProfitAcc: Record<string, ProductProfitReportItem> = {};
                    const productProfits = (orders || []).flatMap(o => o.items || []).reduce((acc: Record<string, ProductProfitReportItem>, item) => {
                        if (!item || !item.productId) return acc;
                        const product = (products || []).find(p => p.id === item.productId);
                        if (!product) return acc;
                        
                        const itemQuantity = Number(item.quantity ?? 0);
                        const itemUnitPrice = Number(item.unitPrice ?? 0);
                        const productCostPrice = Number(product.costPrice ?? 0);

                        const cost = itemQuantity * productCostPrice;
                        const revenue = itemQuantity * itemUnitPrice;
                        const profit = revenue - cost;
                        
                        const current = acc[item.productId] || { id: item.productId, name: item.productName || 'N/A', quantity: 0, revenue: 0, cost: 0, profit: 0 };
                        
                        current.quantity += itemQuantity;
                        current.revenue += revenue;
                        current.cost += cost;
                        current.profit += profit;

                        acc[item.productId] = current;
                        return acc;
                    }, initialProfitAcc);
                    
                    const reportData: ProductProfitReportItem[] = Object.values(productProfits).sort((a, b) => b.profit - a.profit);
                    const columns: Column<ProductProfitReportItem>[] = [
                         { header: 'สินค้า', accessor: 'name'}, { header: 'จำนวนที่ขาย', accessor: item => item.quantity.toLocaleString(), className: 'text-right'},
                         { header: 'ยอดขาย', accessor: item => new Intl.NumberFormat('th-TH', {minimumFractionDigits: 2}).format(item.revenue), className: 'text-right'},
                         { header: 'ต้นทุน', accessor: item => new Intl.NumberFormat('th-TH', {minimumFractionDigits: 2}).format(item.cost), className: 'text-right'},
                         { header: 'กำไร', accessor: item => <span className="font-bold text-green-600">{new Intl.NumberFormat('th-TH', {minimumFractionDigits: 2}).format(item.profit)}</span>, className: 'text-right'},
                    ];
                    setReportContent(<><h3 className="font-semibold mb-4">วิเคราะห์สินค้าทำกำไรสูงสุดระหว่างวันที่ {startDate} ถึง {endDate}</h3><DataTable columns={columns} data={reportData} /></>);
                    setReportDataForExport(reportData); setReportColumnsForExport(columns); setIsExportable(true);
                    break;
                }
                case 'plot_production': {
                    const { data, error } = await supabase.from('plots').select('*');
                    if (error) throw error;
                    const reportData = (data as Plot[] || []).map((plot: Plot) => {
                        const plotSize = Number(plot.size ?? 0);
                        const cost = (plotSize * 2500) + (plot.status === 'กำลังเติบโต' ? 1200 : 0); // Mock cost
                        const yieldAmount = plot.status === 'พร้อมเก็บเกี่ยว' ? (plotSize * 500) : (plot.status === 'กำลังเติบโต' ? plotSize * 150 : 0); // Mock yield
                        return { id: plot.id, name: plot.name, crop: plot.crop, cost, yieldAmount, yield_per_rai: plotSize > 0 ? yieldAmount / plotSize : 0 };
                    });
                    const columns: Column<typeof reportData[0]>[] = [
                        { header: 'แปลง', accessor: 'name' }, { header: 'พืช', accessor: 'crop' },
                        { header: 'ต้นทุนประมาณการ (บาท)', accessor: item => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(item.cost), className: 'text-right' },
                        { header: 'ผลผลิตประมาณการ (กก.)', accessor: item => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(item.yieldAmount), className: 'text-right' },
                        { header: 'ผลผลิต/ไร่ (กก.)', accessor: item => item.yield_per_rai.toFixed(2), className: 'text-right font-bold' },
                    ];
                    setReportContent(<DataTable columns={columns} data={reportData} />);
                    setReportDataForExport(reportData); setReportColumnsForExport(columns); setIsExportable(true);
                    break;
                }
                case 'pnl_statement': {
                    const { data, error } = await supabase.from('financial_transactions').select('type, amount').gte('date', startDate).lte('date', endDate);
                    if (error) throw error;
                    const totalIncome = (data || []).filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
                    const totalExpense = (data || []).filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
                    const netProfit = totalIncome - totalExpense;
                    setReportContent(
                        <div className="border border-gray-200 p-6 rounded-lg max-w-2xl mx-auto"><div className="mt-6 flow-root"><dl className="-my-4 divide-y divide-gray-200 text-base"><div className="flex items-center justify-between py-4"><dt className="font-medium text-green-600">รายได้รวม</dt><dd className="font-medium text-green-600">฿{new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(totalIncome)}</dd></div><div className="flex items-center justify-between py-4"><dt className="font-medium text-red-600">ค่าใช้จ่ายรวม</dt><dd className="font-medium text-red-600">- ฿{new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(totalExpense)}</dd></div><div className="flex items-center justify-between py-5 border-t-2 border-gray-300 mt-4"><dt className="font-bold text-gray-900">กำไร/ขาดทุน สุทธิ</dt><dd className={`font-bold ${netProfit >= 0 ? 'text-gray-900' : 'text-red-700'}`}>฿{new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(netProfit)}</dd></div></dl></div></div>
                    );
                    break;
                }
                case 'balance_sheet': {
                     setReportContent(<div className="border border-gray-200 p-6 rounded-lg max-w-3xl mx-auto"><div className="grid grid-cols-2 gap-8"><div><h4 className="font-bold text-lg mb-2">สินทรัพย์ (Assets)</h4><dl className="space-y-2"><div className="flex justify-between"><span>เงินสด</span><span>฿150,000</span></div><div className="flex justify-between"><span>ลูกหนี้การค้า</span><span>฿80,000</span></div><div className="flex justify-between"><span>สินค้าคงคลัง</span><span>฿250,000</span></div><div className="flex justify-between"><span>ที่ดินและอุปกรณ์</span><span>฿1,200,000</span></div><div className="flex justify-between font-bold border-t pt-2"><span>รวมสินทรัพย์</span><span>฿1,680,000</span></div></dl></div><div><h4 className="font-bold text-lg mb-2">หนี้สินและส่วนของผู้ถือหุ้น</h4><dl className="space-y-2"><div className="flex justify-between"><span>เจ้าหนี้การค้า</span><span>฿120,000</span></div><div className="flex justify-between"><span>เงินกู้ระยะยาว</span><span>฿500,000</span></div><div className="flex justify-between font-bold border-t pt-2"><span>รวมหนี้สิน</span><span>฿620,000</span></div><div className="flex justify-between mt-4"><span>ทุน</span><span>฿1,000,000</span></div><div className="flex justify-between"><span>กำไรสะสม</span><span>฿60,000</span></div><div className="flex justify-between font-bold border-t pt-2"><span>รวมส่วนของผู้ถือหุ้น</span><span>฿1,060,000</span></div></dl><div className="flex justify-between font-bold border-t-2 mt-4 pt-2"><span>รวมหนี้สินและส่วนของผู้ถือหุ้น</span><span>฿1,680,000</span></div></div></div></div>);
                     setIsExportable(false);
                    break;
                }
                case 'active_employees': {
                    const { data, error } = await supabase.from('employees').select('id, name, position, phone').eq('status', 'Active');
                    if(error) throw error;
                    type ActiveEmployeeReportItem = Pick<Employee, 'id' | 'name' | 'position' | 'phone'>;
                    const employeeColumns: Column<ActiveEmployeeReportItem>[] = [
                        { header: 'รหัสพนักงาน', accessor: 'id'}, { header: 'ชื่อ-สกุล', accessor: 'name' },
                        { header: 'ตำแหน่ง', accessor: 'position' }, { header: 'เบอร์โทร', accessor: 'phone' },
                    ];
                    setReportContent(<DataTable columns={employeeColumns} data={data} />);
                    setReportDataForExport(data); setReportColumnsForExport(employeeColumns); setIsExportable(true);
                    break;
                }
                case 'payroll_summary': {
                    const { data, error } = await supabase.from('employees').select('salary').eq('status', 'Active');
                    if (error) throw error;
                    const totalSalary = (data || []).reduce((sum, emp) => sum + Number(emp.salary || 0), 0);
                     setReportContent(<div className="text-center p-8"><p className="text-lg text-gray-600">ยอดรวมเงินเดือนพนักงานที่ใช้งานอยู่</p><p className="text-4xl font-bold text-blue-600 mt-2">฿{new Intl.NumberFormat('th-TH', {minimumFractionDigits: 2}).format(totalSalary)}</p><p className="text-sm text-gray-500 mt-1">จากพนักงานทั้งหมด {(data || []).length} คน</p></div>);
                    setIsExportable(false);
                    break;
                }
                default:
                    setReportContent(null); setReportTitle('');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            setReportContent(<p className="text-red-500 text-center">เกิดข้อผิดพลาดในการสร้างรายงาน</p>);
        } finally {
            setLoading(false);
        }
    };

    const requiresDateFilter = allReportOptions.find(opt => opt.value === reportType)?.requiresDate;

    return (
        <div className="reports-page-container flex flex-col lg:flex-row gap-6">
            <div className="reports-filter-panel lg:w-1/4 bg-white p-6 rounded-lg shadow-md no-print space-y-4 h-fit">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">สร้างรายงาน</h3>
                <div>
                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">ประเภทรายงาน</label>
                    <select id="reportType" value={reportType} onChange={(e) => setReportType(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                        <option value="">-- กรุณาเลือกรายงาน --</option>
                        {reportGroups.map(group => (<optgroup key={group.label} label={group.label}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>))}
                    </select>
                </div>
                {requiresDateFilter && (
                    <div className="space-y-4 pt-2 border-t">
                        <div><label htmlFor="startDate" className="block text-sm font-medium text-gray-700">วันที่เริ่มต้น</label><input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                        <div><label htmlFor="endDate" className="block text-sm font-medium text-gray-700">วันที่สิ้นสุด</label><input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                    </div>
                )}
                <button onClick={handleGenerateReport} disabled={!reportType || loading} className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400">
                    {loading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
                </button>
            </div>

            <div className="report-content-panel lg:w-3/4 bg-white p-6 rounded-lg shadow-md">
                {loading ? <Spinner /> : reportContent ? (
                    <div>
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                           <h2 className="text-2xl font-bold text-gray-800">{reportTitle}</h2>
                           <div className="no-print flex items-center gap-2">
                                <button onClick={handleExportPdf} disabled={!isExportable} className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">PDF</button>
                                <button onClick={handleExportCsv} disabled={!isExportable} className="px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">CSV</button>
                               <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>พิมพ์</button>
                            </div>
                        </div>
                        {reportContent}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">ยังไม่มีรายงาน</h3>
                        <p className="mt-1 text-sm text-gray-500">กรุณาเลือกประเภทรายงานและกด "สร้างรายงาน" เพื่อดูข้อมูล</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;