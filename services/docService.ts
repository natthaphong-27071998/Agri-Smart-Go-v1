
import { SalesOrder, CompanyInfo } from '../types';

// Declare global variables from CDN scripts
declare const docx: any;
declare const saveAs: any;

const fetchImageAsBuffer = (src: string) => {
    return fetch(src)
        .then(response => response.arrayBuffer());
};

const FONT_NAME = "Chakra Petch";

const createHeader = async (company: CompanyInfo) => {
    let logoImage: any | undefined;

    if (company.logoUrl) {
        try {
            const logoBuffer = await fetchImageAsBuffer(company.logoUrl);
            logoImage = new docx.Paragraph({
                children: [
                    new docx.ImageRun({
                        data: logoBuffer,
                        transformation: {
                            width: 80,
                            height: 80,
                        },
                    }),
                ],
            });
        } catch (error) {
            console.error("Error fetching logo for DOCX:", error);
            logoImage = new docx.Paragraph(""); // Empty paragraph if logo fails
        }
    } else {
        logoImage = new docx.Paragraph("");
    }

    return new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        columnWidths: [2000, 7500],
        borders: {
            top: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [logoImage || new docx.Paragraph("")],
                    }),
                    new docx.TableCell({
                        children: [
                            new docx.Paragraph({
                                children: [new docx.TextRun({ text: company.name, bold: true, size: 24, font: FONT_NAME })],
                                alignment: docx.AlignmentType.RIGHT,
                            }),
                            new docx.Paragraph({
                                text: company.address || '',
                                alignment: docx.AlignmentType.RIGHT,
                                run: { font: FONT_NAME }
                            }),
                            new docx.Paragraph({
                                text: `โทร: ${company.phone || ''}`,
                                alignment: docx.AlignmentType.RIGHT,
                                run: { font: FONT_NAME }
                            }),
                            new docx.Paragraph({
                                text: `เลขประจำตัวผู้เสียภาษี: ${company.taxId || ''}`,
                                alignment: docx.AlignmentType.RIGHT,
                                run: { font: FONT_NAME }
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
};

const createItemsTable = (order: SalesOrder) => {
    const tableCell = (text: string, options: any = {}) => {
        const paragraphOptions: any = {
            children: [new docx.TextRun({ text, font: FONT_NAME, ...options.run })],
        };
        if (options.alignment) {
            paragraphOptions.alignment = options.alignment;
        }
        return new docx.TableCell({ children: [new docx.Paragraph(paragraphOptions)] });
    }

    const header = new docx.TableRow({
        tableHeader: true,
        children: [
            tableCell("ชื่อสินค้า", { run: { bold: true } }),
            tableCell("จำนวน", { run: { bold: true }, alignment: docx.AlignmentType.CENTER }),
            tableCell("ราคา/หน่วย", { run: { bold: true }, alignment: docx.AlignmentType.RIGHT }),
            tableCell("รวม", { run: { bold: true }, alignment: docx.AlignmentType.RIGHT }),
        ],
    });

    const rows = order.items.map(item => new docx.TableRow({
        children: [
            tableCell(item.productName ?? 'N/A'),
            tableCell(String(item.quantity ?? 0), { alignment: docx.AlignmentType.CENTER }),
            tableCell((item.unitPrice ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), { alignment: docx.AlignmentType.RIGHT }),
            tableCell((item.total ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), { alignment: docx.AlignmentType.RIGHT }),
        ]
    }));

    return new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        rows: [header, ...rows]
    });
};

const docDefaultStyles = {
    styles: {
        default: {
            document: {
                run: {
                    font: FONT_NAME,
                    size: 22, // 11pt
                },
            },
            heading1: {
                run: {
                    font: FONT_NAME,
                    size: 32, // 16pt
                    bold: true,
                },
                paragraph: {
                    spacing: {
                        after: 240,
                    },
                },
            },
        },
    },
};

export const generateOrderDoc = async (order: SalesOrder, company: CompanyInfo) => {
    const headerTable = await createHeader(company);
    const itemsTable = createItemsTable(order);

    const doc = new docx.Document({
        ...docDefaultStyles,
        sections: [{
            children: [
                headerTable,
                new docx.Paragraph({ text: "", spacing: { after: 400 } }),
                new docx.Paragraph({ text: "Purchase Order / ใบสั่งซื้อ", heading: docx.HeadingLevel.HEADING_1 }),
                new docx.Paragraph({ text: `รหัสสั่งซื้อ: ${order.id}` }),
                new docx.Paragraph({ text: `วันที่: ${order.orderDate || ''}` }),
                new docx.Paragraph({ text: "", spacing: { after: 300 } }),
                new docx.Paragraph({ text: `เรียน: ${order.customerName || ''}` }),
                new docx.Paragraph({ text: "", spacing: { after: 300 } }),
                itemsTable,
                new docx.Paragraph({ text: "", spacing: { after: 400 } }),
                 new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: `ยอดรวมสุทธิ: ${(order.totalAmount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`,
                            bold: true,
                            size: 28,
                            font: FONT_NAME
                        }),
                    ],
                    alignment: docx.AlignmentType.RIGHT,
                }),
            ],
        }],
    });

    docx.Packer.toBlob(doc).then((blob: any) => {
        saveAs(blob, `purchase_order_${order.id}.docx`);
    });
};

export const generateInvoiceDoc = async (order: SalesOrder, company: CompanyInfo) => {
    const headerTable = await createHeader(company);
    const itemsTable = createItemsTable(order);
    
    const issueDate = order.orderDate ? new Date(order.orderDate) : new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(issueDate.getDate() + 30);

    const doc = new docx.Document({
        ...docDefaultStyles,
        sections: [{
            children: [
                headerTable,
                new docx.Paragraph({ text: "", spacing: { after: 400 } }),
                new docx.Paragraph({ text: "Invoice / ใบแจ้งหนี้", heading: docx.HeadingLevel.HEADING_1 }),
                new docx.Paragraph({ text: `เลขที่ใบแจ้งหนี้: INV-${order.id}` }),
                new docx.Paragraph({ text: `อ้างอิงใบสั่งซื้อ: ${order.id}` }),
                new docx.Paragraph({ text: `วันที่ออก: ${issueDate.toLocaleDateString('en-CA')}` }),
                new docx.Paragraph({ text: `ครบกำหนดชำระ: ${dueDate.toLocaleDateString('en-CA')}` }),
                new docx.Paragraph({ text: "", spacing: { after: 300 } }),
                new docx.Paragraph({ text: `เรียน: ${order.customerName || ''}` }),
                new docx.Paragraph({ text: "", spacing: { after: 300 } }),
                itemsTable,
                new docx.Paragraph({ text: "", spacing: { after: 400 } }),
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: `ยอดรวมที่ต้องชำระ: ${(order.totalAmount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`,
                            bold: true,
                            size: 28,
                            font: FONT_NAME
                        }),
                    ],
                    alignment: docx.AlignmentType.RIGHT,
                }),
                new docx.Paragraph({ text: "", spacing: { after: 600 } }),
                ...(company.bankAccount ? [
                    new docx.Paragraph({
                        children: [new docx.TextRun({ text: "รายละเอียดการชำระเงิน:", bold: true, font: FONT_NAME })],
                        border: {
                            top: { style: docx.BorderStyle.SINGLE, size: 6, color: "auto" },
                        },
                        spacing: { before: 200 }
                    }),
                    new docx.Paragraph({ text: `ธนาคาร: ${company.bankAccount.bankName}` }),
                    new docx.Paragraph({ text: `ชื่อบัญชี: ${company.bankAccount.accountName}` }),
                    new docx.Paragraph({ text: `เลขที่บัญชี: ${company.bankAccount.accountNumber}` }),
                ] : [])
            ],
        }],
    });

    docx.Packer.toBlob(doc).then((blob: any) => {
        saveAs(blob, `invoice_${order.id}.docx`);
    });
};
