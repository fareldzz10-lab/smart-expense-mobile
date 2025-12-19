
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserProfile } from '../types';
import { db } from '../services/storageService';
import { formatCurrency, formatDate } from './formatters';

export const generatePDFReport = async (user: UserProfile) => {
  try {
    const doc = new jsPDF();
    const txs = await db.transactions.orderBy('date').reverse().toArray();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Smart Expense Report', 14, 22);
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated for: ${user.name}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 33);

    // Table
    const tableData = txs.map(t => [
      formatDate(t.date),
      t.title,
      t.category,
      t.type === 'income' ? '+' : '-',
      formatCurrency(t.amount)
    ]);

    autoTable(doc, {
      head: [['Date', 'Title', 'Category', 'Type', 'Amount']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }, // Primary purple
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`SmartExpense_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (error) {
    console.error("PDF Generation Error", error);
    return false;
  }
};

export const generateCSVExport = async () => {
  try {
    const txs = await db.transactions.orderBy('date').reverse().toArray();
    const headers = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Notes'];
    
    const csvContent = [
      headers.join(','),
      ...txs.map(t => [
        t.date.toISOString().split('T')[0],
        `"${t.title.replace(/"/g, '""')}"`, // Escape quotes
        t.type,
        t.category,
        t.amount,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-expense-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("CSV Export Error", error);
    return false;
  }
};

export const generateBackup = async (user: UserProfile) => {
  try {
    const data = {
      transactions: await db.transactions.toArray(),
      budgets: await db.budgets.toArray(),
      recurring: await db.recurring.toArray(),
      savings: await db.savings.toArray(),
      categories: await db.categories.toArray(),
      userProfile: user,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-expense-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Backup Generation Error", error);
    return false;
  }
};
