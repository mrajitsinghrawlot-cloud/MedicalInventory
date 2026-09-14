import { Medicine, PurchaseBill, StockMovement } from '../types/inventory';

export const exportMedicinesToCSV = (medicines: Medicine[]) => {
  const headers = [
    'Medicine ID',
    'Brand Name',
    'Generic Name',
    'Category',
    'Dosage Form',
    'Strength',
    'Manufacturer',
    'Batch No',
    'Barcode',
    'Expiry Date',
    'Stock Qty',
    'Min Threshold',
    'Purchase Cost (INR)',
    'MRP (INR)',
    'Total Valuation (INR)',
    'Rack Location',
    'Schedule',
    'Status'
  ];

  const rows = medicines.map(m => [
    m.id,
    `"${m.name.replace(/"/g, '""')}"`,
    `"${m.genericName.replace(/"/g, '""')}"`,
    `"${m.category}"`,
    m.form,
    m.strength,
    `"${m.manufacturer.replace(/"/g, '""')}"`,
    m.batchNumber,
    m.barcode,
    m.expiryDate,
    m.stockQuantity,
    m.minStockThreshold,
    m.purchasePrice.toFixed(2),
    m.mrp.toFixed(2),
    (m.stockQuantity * m.purchasePrice).toFixed(2),
    `"${m.rackLocation}"`,
    m.scheduleType,
    m.status
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `MediStock_Inventory_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
};

export const exportBillsToCSV = (bills: PurchaseBill[]) => {
  const headers = [
    'Bill ID',
    'Bill Number',
    'Invoice Date',
    'Due Date',
    'Vendor Name',
    'Items Count',
    'Subtotal',
    'Tax Amount',
    'Discount',
    'Grand Total',
    'Paid Amount',
    'Payment Status',
    'Payment Method'
  ];

  const rows = bills.map(b => [
    b.id,
    b.billNumber,
    b.invoiceDate,
    b.dueDate,
    `"${b.vendorName.replace(/"/g, '""')}"`,
    b.items.length,
    b.subtotal.toFixed(2),
    b.taxAmount.toFixed(2),
    b.discountAmount.toFixed(2),
    b.grandTotal.toFixed(2),
    b.paidAmount.toFixed(2),
    b.paymentStatus,
    b.paymentMethod
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `MediStock_PurchaseBills_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
};

export const exportMovementsToCSV = (movements: StockMovement[]) => {
  const headers = [
    'Movement ID',
    'Date & Time',
    'Medicine Name',
    'Type',
    'Quantity Change',
    'Previous Stock',
    'New Stock',
    'Reason / Reference',
    'Performed By'
  ];

  const rows = movements.map(m => [
    m.id,
    m.date,
    `"${m.medicineName.replace(/"/g, '""')}"`,
    m.type,
    m.quantity,
    m.previousStock,
    m.newStock,
    `"${m.reason.replace(/"/g, '""')}"`,
    `"${m.performedBy}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `MediStock_StockMovements_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
};

const downloadBlob = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
