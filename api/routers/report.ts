import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { expenses } from "@db/schema";
import { getDb } from "../queries/connection";
import { transactions, products, transactionItems } from "@db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export const reportRouter = createRouter({
  summary: publicQuery
    .input(
      z.object({
        fromDate: z.string(),
        toDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const fromDate = new Date(input.fromDate);
      const toDate = new Date(input.toDate);
      toDate.setHours(23, 59, 59, 999);

      const conditions = [
        gte(transactions.createdAt, fromDate),
        lte(transactions.createdAt, toDate),
      ];

      // Total sales
      const salesResult = await db
        .select({ total: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)` })
        .from(transactions)
        .where(and(...conditions));

      // Transaction count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(transactions)
        .where(and(...conditions));

      // Estimated profit (sum of (unitPrice - purchasePrice) * quantity)
      const profitResult = await db
        .select({
          profit: sql<number>`COALESCE(SUM((${transactionItems.unitPrice} - ${products.purchasePrice}) * ${transactionItems.quantity}), 0)`,
        })
        .from(transactionItems)
        .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
        .innerJoin(products, eq(transactionItems.productId, products.id))
        .where(and(...conditions));

      return {
        totalSales: salesResult[0]?.total ?? 0,
        transactionCount: countResult[0]?.count ?? 0,
        estimatedProfit: profitResult[0]?.profit ?? 0,
      };
    }),

  byDepartment: publicQuery
    .input(
      z.object({
        fromDate: z.string(),
        toDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const fromDate = new Date(input.fromDate);
      const toDate = new Date(input.toDate);
      toDate.setHours(23, 59, 59, 999);

      const conditions = [
        gte(transactions.createdAt, fromDate),
        lte(transactions.createdAt, toDate),
      ];

      const result = await db
        .select({
          department: transactions.department,
          total: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(transactions.department);

      return result;
    }),

  topProducts: publicQuery
    .input(
      z.object({
        fromDate: z.string(),
        toDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const fromDate = new Date(input.fromDate);
      const toDate = new Date(input.toDate);
      toDate.setHours(23, 59, 59, 999);

      const conditions = [
        gte(transactions.createdAt, fromDate),
        lte(transactions.createdAt, toDate),
      ];

      return db
        .select({
          productName: transactionItems.productName,
          totalQty: sql<number>`SUM(${transactionItems.quantity})`,
          totalRevenue: sql<number>`SUM(${transactionItems.totalPrice})`,
        })
        .from(transactionItems)
        .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
        .where(and(...conditions))
        .groupBy(transactionItems.productName)
        .orderBy(sql`SUM(${transactionItems.quantity}) DESC`)
        .limit(5);
    }),

  transactionDetails: publicQuery
    .input(
      z.object({
        fromDate: z.string(),
        toDate: z.string(),
        limit: z.number().int().optional().default(20),
        offset: z.number().int().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const fromDate = new Date(input.fromDate);
      const toDate = new Date(input.toDate);
      toDate.setHours(23, 59, 59, 999);

      const conditions = [
        gte(transactions.createdAt, fromDate),
        lte(transactions.createdAt, toDate),
      ];

      const txs = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Calculate profit per transaction
      const result = [];
      for (const tx of txs) {
        const items = await db
          .select()
          .from(transactionItems)
          .where(eq(transactionItems.transactionId, tx.id));

        let profit = 0;
        for (const item of items) {
          if (item.productId === null) continue;
          const product = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          if (product[0]) {
            profit += (item.unitPrice - product[0].purchasePrice) * item.quantity;
          }
        }

        result.push({ ...tx, profit: Math.round(profit * 100) / 100 });
      }

      return result;
    }),
});
