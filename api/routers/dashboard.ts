import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { transactions, products, transactionItems } from "@db/schema";
import { eq, and, gte, desc, sql, isNotNull } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Today's sales
    const todaySales = await db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)` })
      .from(transactions)
      .where(gte(transactions.createdAt, startOfDay));

    // Today's transaction count
    const todayCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transactions)
      .where(gte(transactions.createdAt, startOfDay));

    // Unpaid debts total
    const unpaidDebts = await db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)` })
      .from(transactions)
      .where(eq(transactions.isPaid, false));

    // Top selling product today
    const topProduct = await db
      .select({
        productName: transactionItems.productName,
        totalQty: sql<number>`SUM(${transactionItems.quantity})`,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(gte(transactions.createdAt, startOfDay))
      .groupBy(transactionItems.productName)
      .orderBy(sql`SUM(${transactionItems.quantity}) DESC`)
      .limit(1);

    return {
      todaySales: todaySales[0]?.total ?? 0,
      todayCount: todayCount[0]?.count ?? 0,
      unpaidDebts: unpaidDebts[0]?.total ?? 0,
      topProduct: topProduct[0]?.productName ?? "—",
    };
  }),

  recentTransactions: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(20);
  }),

  lowStock: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(products)
      .where(
        and(
          isNotNull(products.quantity),
          sql`${products.quantity} <= ${products.minQuantity}`
        )
      )
      .orderBy(products.quantity);
  }),
});
