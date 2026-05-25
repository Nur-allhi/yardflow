import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _archiver: any;
async function getArchiver() {
  if (!_archiver) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("archiver");
    _archiver = mod.default || mod;
  }
  return _archiver;
}
import {
  organizations, users,
  accounts, accountTransactions,
  materialCategories, materialSubtypes, stockLedger, scrapPool, consumablesLog, consumptionLogs,
  vendors, purchases, purchaseItems, purchasePayments, purchaseOtherExpenses,
  customers, sales, saleItems, salePayments,
  workers, salaryAdvances, salaryPayments,
  periodReports, activityLogs,
  inventoryPool, inventoryMovements,
  simplePurchases, simplePurchaseItems, simplePurchasePayments, simplePurchaseOtherExpenses,
  simpleSales, simpleSaleItems, simpleSalePayments,
} from "@/lib/db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableRef = any;

const TABLE_ENTRIES: {
  name: string;
  ref: TableRef;
  hasDeletedAt: boolean;
  useOrgId: boolean;
}[] = [
  { name: "users", ref: users, hasDeletedAt: true, useOrgId: true },
  { name: "accounts", ref: accounts, hasDeletedAt: true, useOrgId: true },
  { name: "accountTransactions", ref: accountTransactions, hasDeletedAt: true, useOrgId: true },
  { name: "materialCategories", ref: materialCategories, hasDeletedAt: true, useOrgId: true },
  { name: "materialSubtypes", ref: materialSubtypes, hasDeletedAt: true, useOrgId: true },
  { name: "stockLedger", ref: stockLedger, hasDeletedAt: true, useOrgId: true },
  { name: "scrapPool", ref: scrapPool, hasDeletedAt: true, useOrgId: true },
  { name: "consumablesLog", ref: consumablesLog, hasDeletedAt: true, useOrgId: true },
  { name: "consumptionLogs", ref: consumptionLogs, hasDeletedAt: true, useOrgId: true },
  { name: "vendors", ref: vendors, hasDeletedAt: true, useOrgId: true },
  { name: "purchases", ref: purchases, hasDeletedAt: true, useOrgId: true },
  { name: "purchaseItems", ref: purchaseItems, hasDeletedAt: true, useOrgId: true },
  { name: "purchasePayments", ref: purchasePayments, hasDeletedAt: true, useOrgId: true },
  { name: "purchaseOtherExpenses", ref: purchaseOtherExpenses, hasDeletedAt: true, useOrgId: true },
  { name: "customers", ref: customers, hasDeletedAt: true, useOrgId: true },
  { name: "sales", ref: sales, hasDeletedAt: true, useOrgId: true },
  { name: "saleItems", ref: saleItems, hasDeletedAt: true, useOrgId: true },
  { name: "salePayments", ref: salePayments, hasDeletedAt: true, useOrgId: true },
  { name: "workers", ref: workers, hasDeletedAt: true, useOrgId: true },
  { name: "salaryAdvances", ref: salaryAdvances, hasDeletedAt: true, useOrgId: true },
  { name: "salaryPayments", ref: salaryPayments, hasDeletedAt: true, useOrgId: true },
  { name: "periodReports", ref: periodReports, hasDeletedAt: true, useOrgId: true },
  { name: "activityLogs", ref: activityLogs, hasDeletedAt: true, useOrgId: true },
  { name: "inventoryMovements", ref: inventoryMovements, hasDeletedAt: false, useOrgId: true },
  { name: "inventoryPool", ref: inventoryPool, hasDeletedAt: false, useOrgId: true },
  { name: "simplePurchases", ref: simplePurchases, hasDeletedAt: true, useOrgId: true },
  { name: "simplePurchaseItems", ref: simplePurchaseItems, hasDeletedAt: true, useOrgId: true },
  { name: "simplePurchasePayments", ref: simplePurchasePayments, hasDeletedAt: true, useOrgId: true },
  { name: "simplePurchaseOtherExpenses", ref: simplePurchaseOtherExpenses, hasDeletedAt: true, useOrgId: true },
  { name: "simpleSales", ref: simpleSales, hasDeletedAt: true, useOrgId: true },
  { name: "simpleSaleItems", ref: simpleSaleItems, hasDeletedAt: true, useOrgId: true },
  { name: "simpleSalePayments", ref: simpleSalePayments, hasDeletedAt: true, useOrgId: true },
];

const TABLE_MAP = new Map(TABLE_ENTRIES.map((e) => [e.name, e]));

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map((h) => toCsvValue(h)).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => toCsvValue(row[h])).join(","));
  }
  return lines.join("\n");
}

async function queryTable(
  entry: (typeof TABLE_ENTRIES)[number],
  orgId: string,
): Promise<Record<string, unknown>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];

  if (entry.useOrgId) {
    conditions.push(eq(entry.ref.organization_id, orgId));
  } else {
    conditions.push(eq(entry.ref.id, orgId));
  }

  if (entry.hasDeletedAt) {
    conditions.push(sql`deleted_at IS NULL`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await db.select().from(entry.ref).where(and(...conditions));

  if (entry.name === "users") {
    return rows.map((row) => {
      const rest = { ...row };
      delete rest.password_hash;
      return rest as Record<string, unknown>;
    });
  }

  return rows as Record<string, unknown>[];
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const orgId = session.org_id;

    const [org] = await db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, orgId), sql`${organizations.deleted_at} IS NULL`))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "json";
    const tableParam = url.searchParams.get("table");

    const dateStr = formatDate(new Date());
    const safeName = org.name.replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "csv") {
      if (tableParam && tableParam !== "all") {
        const entry = TABLE_MAP.get(tableParam);
        if (!entry) {
          return NextResponse.json({ error: `Unknown table: ${tableParam}` }, { status: 400 });
        }

        let rows: Record<string, unknown>[];
        if (tableParam === "organizations") {
          rows = [org as unknown as Record<string, unknown>];
        } else {
          rows = await queryTable(entry, orgId);
        }

        const csv = rowsToCsv(rows);

        logActivity({
          orgId,
          userId: session.user_id,
          action: "export",
          entityType: tableParam,
          description: `Exported ${tableParam} as CSV`,
        });

        return new NextResponse(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="yardflow-export-${safeName}-${tableParam}-${dateStr}.csv"`,
          },
        });
      }

      if (tableParam === "all") {
        const archiverFn = await getArchiver();
        const archive = archiverFn("zip", { zlib: { level: 9 } });
        const buffers: Buffer[] = [];
        archive.on("data", (d: Buffer) => buffers.push(d));

        const orgRows = [org as unknown as Record<string, unknown>];
        archive.append(rowsToCsv(orgRows), { name: "organization.csv" });

        for (const entry of TABLE_ENTRIES) {
          const rows = await queryTable(entry, orgId);
          const csv = rowsToCsv(rows);
          archive.append(csv, { name: `${entry.name}.csv` });
        }

        await new Promise<void>((resolve, reject) => {
          archive.on("finish", resolve);
          archive.on("error", reject);
          archive.finalize();
        });
        const zipBuffer = Buffer.concat(buffers);

        logActivity({
          orgId,
          userId: session.user_id,
          action: "export",
          entityType: "all",
          description: "Exported all data as CSV ZIP",
        });

        return new NextResponse(zipBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="yardflow-export-${safeName}-${dateStr}.zip"`,
          },
        });
      }

      return NextResponse.json(
        { error: "Missing table parameter. Specify ?table=<name> or ?table=all" },
        { status: 400 },
      );
    }

    const data: Record<string, Record<string, unknown>[]> = {
      organization: [org as unknown as Record<string, unknown>],
    };

    for (const entry of TABLE_ENTRIES) {
      const rows = await queryTable(entry, orgId);
      data[entry.name] = rows;
    }

    logActivity({
      orgId,
      userId: session.user_id,
      action: "export",
      entityType: "all",
      description: "Exported all data as JSON",
    });

    const json = JSON.stringify(
      { ...data, exported_at: new Date().toISOString(), version: "1.0.0" },
      null,
      2,
    );

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="yardflow-export-${safeName}-${dateStr}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
