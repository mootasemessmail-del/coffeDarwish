import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { transactions, transactionItems, products } from "@db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export const transactionRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        department: z.enum(["lounge", "oven"]),
        totalAmount: z.number().positive(),
        paymentType: z.enum(["cash", "debt"]),
        items: z.array(
          z.object({
            productId: z.number(),
            productName: z.string(),
            unitPrice: z.number(),
            quantity: z.number().int().positive(),
            totalPrice: z.number(),
            isOvenProduct: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Get next receipt number
      const lastReceipt = await db
        .select({ maxNum: sql<number>`COALESCE(MAX(${transactions.receiptNumber}), 0)` })
        .from(transactions);
      const receiptNumber = (lastReceipt[0]?.maxNum ?? 0) + 1;

      // Create transaction
      const result = await db
        .insert(transactions)
        .values({
          receiptNumber,
          department: input.department,
          totalAmount: input.totalAmount,
          paymentType: input.paymentType,
          isPaid: input.paymentType === "cash",
        })
        .returning();

      const transaction = result[0];

      // Create transaction items
      for (const item of input.items) {
        await db.insert(transactionItems).values({
          transactionId: transaction.id,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          isOvenProduct: item.isOvenProduct,
        });

        // Update inventory for lounge products only
        if (!item.isOvenProduct) {
          const product = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          
          if (product[0] && product[0].quantity !== null) {
            await db
              .update(products)
              .set({ quantity: Math.max(0, product[0].quantity - item.quantity) })
              .where(eq(products.id, item.productId));
          }
        }
      }

      return transaction;
    }),

  list: publicQuery
    .input(
      z.object({
        limit: z.number().int().optional().default(50),
        offset: z.number().int().optional().default(0),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.fromDate) {
        conditions.push(gte(transactions.createdAt, new Date(input.fromDate)));
      }
      if (input?.toDate) {
        conditions.push(lte(transactions.createdAt, new Date(input.toDate)));
      }

      const query = conditions.length > 0
        ? db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.createdAt)).limit(input?.limit ?? 50).offset(input?.offset ?? 0)
        : db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(input?.limit ?? 50).offset(input?.offset ?? 0);

      return query;
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const transaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, input.id));

      if (!transaction[0]) return null;

      const items = await db
        .select()
        .from(transactionItems)
        .where(eq(transactionItems.transactionId, input.id));

      return { ...transaction[0], items };
    }),

  markAsPaid: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(transactions)
        .set({ isPaid: true, paymentType: "cash" })
        .where(eq(transactions.id, input.id));
      return { success: true };
    }),
});
