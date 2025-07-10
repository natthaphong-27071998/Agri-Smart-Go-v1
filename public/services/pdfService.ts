

import { SalesOrder, CompanyInfo, BankAccountInfo } from '../types';
import { chakraPetchBase64 } from '../assets/SarabunFont';

declare const jspdf: any;

const generatePdfBase = (
    order: SalesOrder,
    company: CompanyInfo,
    docType: 'Purchase Order' | 'Invoice',
    callback: (doc: any) => void
) => {
    const doc = new jspdf.jsPDF('p', 'pt', 'a4');

    // --- Add and set Chakra Petch Font ---
    doc.addFileToVFS('ChakraPetch-Regular.ttf', chakraPetchBase64);
    doc.addFont('ChakraPetch-Regular.ttf', 'ChakraPetch', 'normal');
    doc.setFont('ChakraPetch', 'normal');

    const logoUrl = company.logoUrl;

    // --- Header ---
    if (logoUrl && logoUrl.startsWith('data:image/')) {
        try {
            // Extract base64 data and image format
            const imageFormat = logoUrl.match(/data:image\/(.+);base64,/)?.[1].toUpperCase() || 'PNG';
            const base64Data = logoUrl.substring(logoUrl.indexOf(',') + 1);
            doc.addImage(base64Data, imageFormat, 40, 40, 80, 80);
        } catch (e) {
            console.error("jsPDF addImage with base64 data failed:", e);
        }
    }

    doc.setFontSize(10);
    // Company Details (Sender) - Top Right
    doc.text(company.name, 555, 55, { align: 'right' });
    const addressLines = doc.splitTextToSize(company.address || '', 150);
    doc.text(addressLines, 555, 70, { align: 'right' });
    const companyContactY = 70 + (addressLines.length * 12);
    doc.text(`โทร: ${company.phone}`, 555, companyContactY, { align: 'right' });
    doc.text(`เลขประจำตัวผู้เสียภาษี: ${company.taxId}`, 555, companyContactY + 12, { align: 'right' });
    
    // Let the callback function add the specific content
    callback(doc);

    doc.save(`${docType.split(' ')[0].toLowerCase()}_${order.order_code}.pdf`);
};


export const generateOrderPdf = (order: SalesOrder, company: CompanyInfo) => {
    generatePdfBase(order, company, 'Purchase Order', (doc) => {
        // --- Document Title & Details ---
        doc.setFontSize(26);
        doc.text('Purchase Order / ใบสั่งซื้อ', 40, 160);
        doc.setFontSize(11);
        doc.text(`รหัสสั่งซื้อ: ${order.order_code}`, 40, 180);
        doc.text(`วันที่: ${order.orderDate}`, 40, 195);
        
        // --- Customer Details (Recipient) ---
        doc.text('เรียน:', 40, 220);
        doc.text(order.customerName || '', 40, 235);
        
        // --- Table ---
        const tableColumn = ["รหัสสินค้า", "ชื่อสินค้า", "จำนวน", "ราคา/หน่วย", "รวม"];
        const tableRows: any[] = order.items.map(item => [
            item.product_code,
            item.productName,
            item.quantity,
            (item.unitPrice ?? 0).toFixed(2),
            (item.total ?? 0).toFixed(2),
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 260,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94], font: 'ChakraPetch', fontStyle: 'normal' },
            styles: { font: 'ChakraPetch', fontSize: 10 },
        });

        // --- Footer / Total ---
        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFontSize(14);
        doc.text(`ยอดรวมสุทธิ: ${(order.totalAmount ?? 0).toFixed(2)} บาท`, 555, finalY + 40, { align: 'right' });
        doc.setFontSize(10);
        doc.text("ขอขอบคุณที่ใช้บริการ", 40, finalY + 40);
    });
};

export const generateInvoicePdf = (order: SalesOrder, company: CompanyInfo) => {
     generatePdfBase(order, company, 'Invoice', (doc) => {
        // --- Document Title & Details ---
        doc.setFontSize(26);
        doc.text('Invoice / ใบแจ้งหนี้', 40, 160);
        doc.setFontSize(11);
        const issueDate = order.orderDate ? new Date(order.orderDate) : new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(issueDate.getDate() + 30);
        doc.text(`เลขที่ใบแจ้งหนี้: INV-${order.order_code}`, 40, 180);
        doc.text(`อ้างอิงใบสั่งซื้อ: ${order.order_code}`, 40, 195);
        doc.text(`วันที่ออก: ${issueDate.toLocaleDateString('en-CA')}`, 40, 210);
        doc.text(`ครบกำหนดชำระ: ${dueDate.toLocaleDateString('en-CA')}`, 40, 225);

        // --- Customer Details (Recipient) ---
        doc.text('เรียน:', 40, 250);
        doc.text(order.customerName || '', 40, 265);

        // --- Table ---
        const tableColumn = ["รหัสสินค้า", "ชื่อสินค้า", "จำนวน", "ราคา/หน่วย", "รวม"];
        const tableRows: any[] = order.items.map(item => [
            item.product_code, item.productName, item.quantity, (item.unitPrice ?? 0).toFixed(2), (item.total ?? 0).toFixed(2)
        ]);
        (doc as any).autoTable({
            head: [tableColumn], body: tableRows, startY: 290, theme: 'grid', 
            headStyles: { fillColor: [22, 163, 74], font: 'ChakraPetch', fontStyle: 'normal' }, 
            styles: { font: 'ChakraPetch', fontSize: 10 },
        });

        const finalY = (doc as any).lastAutoTable.finalY;

        // --- Total ---
        doc.setFontSize(12);
        const grandTotalString = `${(order.totalAmount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`;
        doc.text('ยอดรวมที่ต้องชำระ:', 450, finalY + 40, { align: 'right' });
        doc.text(grandTotalString, 555, finalY + 40, { align: 'right' });


        // --- Payment Details ---
        if (company.bankAccount && typeof company.bankAccount === 'object' && 'bankName' in company.bankAccount) {
            const bankAccount = company.bankAccount as unknown as BankAccountInfo;
            doc.setLineWidth(0.5);
            doc.line(40, finalY + 70, 555, finalY + 70);
            doc.setFontSize(12);
            doc.text("รายละเอียดการชำระเงิน:", 40, finalY + 90);
            doc.setFontSize(10);
            doc.text(`ธนาคาร: ${bankAccount.bankName}`, 40, finalY + 105);
            doc.text(`ชื่อบัญชี: ${bankAccount.accountName}`, 40, finalY + 120);
            doc.text(`เลขที่บัญชี: ${bankAccount.accountNumber}`, 40, finalY + 135);
        }
    });
};