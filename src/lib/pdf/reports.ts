import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type JsPdfWithTable = jsPDF & { lastAutoTable: { finalY: number } };

interface ReportData {
  id: string;
  period_type: "monthly" | "yearly" | "custom";
  start_date: string;
  end_date: string;
  total_purchased_kg: string;
  total_sold_fabricated_kg: string;
  total_sold_raw_kg: string;
  total_scrap_sold_kg: string;
  current_stock_kg: string;
  burnout_kg: string;
  burnout_percent: string;
  total_income: string;
  total_purchase_cost: string;
  total_consumables_cost: string;
  total_salary_cost: string;
  total_other_expenses: string;
  total_cost: string;
  net_profit: string;
  profit_per_kg: string;
  result: "profit" | "loss";
  generated_at: string;
}

function fmtMoney(n: number | string): string {
  const val = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(val)) return "৳0";
  return "৳" + val.toLocaleString("en-IN");
}

function fmtKg(n: number | string): string {
  const val = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(val)) return "0.000 kg";
  return (
    val.toLocaleString("en-IN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }) + " kg"
  );
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function generateReportPdf(report: ReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const isProfit = report.result === "profit";

  const bannerColor: [number, number, number] = isProfit
    ? [5, 150, 105]
    : [186, 26, 26];
  const dark: [number, number, number] = [25, 28, 30];
  const muted: [number, number, number] = [80, 95, 118];
  const lightBg: [number, number, number] = [242, 244, 246];
  const incomeColor: [number, number, number] = [5, 150, 105];
  const costColor: [number, number, number] = [186, 26, 26];

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("YardFlow ERP", margin, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  const periodLabel = `${fmtDate(report.start_date)} - ${fmtDate(report.end_date)}`;
  doc.text(`Period Report: ${periodLabel}`, margin, 32);

  const bannerY = 42;
  doc.setFillColor(...bannerColor);
  doc.roundedRect(margin, bannerY, contentWidth, 22, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(isProfit ? "PROFIT" : "LOSS", margin + 6, bannerY + 9);

  doc.setFontSize(14);
  doc.text(fmtMoney(report.net_profit), pageWidth - margin - 6, bannerY + 9, {
    align: "right",
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Profit per kg: ${fmtMoney(report.profit_per_kg)}`,
    pageWidth - margin - 6,
    bannerY + 17,
    { align: "right" },
  );

  const volStartY = bannerY + 32;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("Volume Analysis", margin, volStartY);

  autoTable(doc, {
    startY: volStartY + 4,
    head: [["Metric", "Value"]],
    body: [
      ["Total Purchased", fmtKg(report.total_purchased_kg)],
      ["Sold (Fabricated)", fmtKg(report.total_sold_fabricated_kg)],
      ["Sold (Raw)", fmtKg(report.total_sold_raw_kg)],
      ["Scrap Sold", fmtKg(report.total_scrap_sold_kg)],
      ["Current Stock", fmtKg(report.current_stock_kg)],
      [
        "Burnout (Gap)",
        `${fmtKg(report.burnout_kg)} (${parseFloat(report.burnout_percent).toFixed(2)}%)`,
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 9,
      textColor: dark,
      cellPadding: { top: 3, bottom: 3 },
    },
    headStyles: {
      fillColor: lightBg,
      fontStyle: "bold",
      fontSize: 9,
      textColor: dark,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: {
        cellWidth: contentWidth * 0.4,
        halign: "right",
        fontStyle: "bold",
      },
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  const finStartY = (doc as JsPdfWithTable).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("Financial Analysis", margin, finStartY);

  autoTable(doc, {
    startY: finStartY + 4,
    body: [
      [
        {
          content: "Income",
          colSpan: 2,
          styles: {
            fillColor: lightBg,
            fontStyle: "bold",
            fontSize: 9,
            textColor: incomeColor,
          },
        },
      ],
      ["Fabricated Sales Revenue", fmtMoney(report.total_income)],
      [
        {
          content: "Total Income",
          styles: {
            fontStyle: "bold",
            textColor: incomeColor,
          },
        },
        {
          content: fmtMoney(report.total_income),
          styles: {
            halign: "right",
            fontStyle: "bold",
            textColor: incomeColor,
          },
        },
      ],
      [
        {
          content: "Costs",
          colSpan: 2,
          styles: {
            fillColor: lightBg,
            fontStyle: "bold",
            fontSize: 9,
            textColor: costColor,
          },
        },
      ],
      ["Purchase Cost", fmtMoney(report.total_purchase_cost)],
      ["Consumables Cost", fmtMoney(report.total_consumables_cost)],
      ["Salary Cost", fmtMoney(report.total_salary_cost)],
      ["Other Expenses", fmtMoney(report.total_other_expenses)],
      [
        {
          content: "Total Cost",
          styles: { fontStyle: "bold" },
        },
        {
          content: fmtMoney(report.total_cost),
          styles: { halign: "right", fontStyle: "bold" },
        },
      ],
      [
        {
          content: isProfit ? "Net Profit" : "Net Loss",
          styles: {
            fontStyle: "bold",
            fontSize: 10,
            textColor: bannerColor,
          },
        },
        {
          content: fmtMoney(report.net_profit),
          styles: {
            halign: "right",
            fontStyle: "bold",
            fontSize: 10,
            textColor: bannerColor,
          },
        },
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 9,
      textColor: dark,
      cellPadding: { top: 3, bottom: 3 },
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: {
        cellWidth: contentWidth * 0.4,
        halign: "right",
        fontStyle: "bold",
      },
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  const footerY = (doc as JsPdfWithTable).lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text(`Generated: ${fmtDate(report.generated_at)}`, margin, footerY);
  doc.text("YardFlow ERP", pageWidth - margin, footerY, { align: "right" });

  doc.save(`report-${report.id}.pdf`);
}
