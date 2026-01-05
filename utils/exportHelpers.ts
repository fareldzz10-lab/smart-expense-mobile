import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { UserProfile } from "../types";
import { db } from "../services/storageService";
import { formatCurrency, formatDate } from "./formatters";

export const generatePDFReport = async (user: UserProfile) => {
  try {
    const doc = new jsPDF();
    const txs = await db.transactions.orderBy("date").reverse().toArray();

    // Calculate Totals
    let totalIncome = 0;
    let totalExpense = 0;

    txs.forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
    });
    const netBalance = totalIncome - totalExpense;

    // --- Header Section ---
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text("Smart Expense Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Generated for: ${user.name}`, 14, 28);
    const dateStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Date: ${dateStr}`, 14, 34);

    // --- Summary Section ---
    const summaryY = 45;

    // Background for summary
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(14, summaryY, 182, 25, 3, 3, "FD");

    // Headers
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL INCOME", 20, summaryY + 8);
    doc.text("TOTAL EXPENSE", 80, summaryY + 8);
    doc.text("NET BALANCE", 140, summaryY + 8);

    // Values
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text(formatCurrency(totalIncome), 20, summaryY + 18);

    doc.setTextColor(239, 68, 68); // Red 500
    doc.text(formatCurrency(totalExpense), 80, summaryY + 18);

    doc.setTextColor(59, 130, 246); // Blue 500
    doc.text(formatCurrency(netBalance), 140, summaryY + 18);

    // Reset font
    doc.setFont("helvetica", "normal");

    // --- Table Section ---
    const tableData = txs.map((t) => [
      formatDate(t.date),
      t.title,
      t.category,
      t.type.toUpperCase(),
      formatCurrency(t.amount),
      t.notes || "-",
    ]);

    autoTable(doc, {
      startY: summaryY + 35,
      head: [["Date", "Title", "Category", "Type", "Amount", "Notes"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42], // Slate 900
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [51, 65, 85], // Slate 700
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Slate 50
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Date
        1: { cellWidth: 40 }, // Title
        2: { cellWidth: 30 }, // Category
        3: { cellWidth: 20, halign: "center" }, // Type
        4: { cellWidth: 35, halign: "right" }, // Amount
        5: { cellWidth: "auto" }, // Notes
      },
      didParseCell: function (data) {
        // Color code Amount column based on type
        if (data.section === "body" && data.column.index === 4) {
          const rowIdx = data.row.index;
          const type = txs[rowIdx].type;
          if (type === "income") {
            data.cell.styles.textColor = [16, 185, 129]; // Green
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }
        // Color code Type column
        if (data.section === "body" && data.column.index === 3) {
          const rowIdx = data.row.index;
          const type = txs[rowIdx].type;
          if (type === "income") {
            data.cell.styles.textColor = [16, 185, 129];
          } else {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: "right" }
      );
      doc.text(
        `Smart Expense - Generated on ${new Date().toLocaleString()}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(
      `SmartExpense_Report_${new Date().toISOString().split("T")[0]}.pdf`
    );
    return true;
  } catch (error) {
    console.error("PDF Generation Error", error);
    return false;
  }
};

export const generateCSVExport = async () => {
  try {
    const txs = await db.transactions.orderBy("date").reverse().toArray();
    const headers = ["Date", "Title", "Type", "Category", "Amount", "Notes"];

    const csvContent = [
      headers.join(","),
      ...txs.map((t) =>
        [
          t.date.toISOString().split("T")[0],
          `"${t.title.replace(/"/g, '""')}"`, // Escape quotes
          t.type,
          t.category,
          t.amount,
          `"${(t.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-expense-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
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
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-expense-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
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
