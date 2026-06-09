import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { products } from "@db/schema";
import { eq, like, and } from "drizzle-orm";

export const productRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        department: z.enum(["lounge", "oven"]).optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.department) {
        conditions.push(eq(products.department, input.department));
      }
      if (input?.search) {
        conditions.push(like(products.name, `%${input.search}%`));
      }
      if (conditions.length > 0) {
        return db.select().from(products).where(and(...conditions)).orderBy(products.name);
      }
      return db.select().from(products).orderBy(products.name);
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        department: z.enum(["lounge", "oven"]),
        purchasePrice: z.number().positive(),
        salePrice: z.number().positive(),
        quantity: z.number().int().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(products).values({
        name: input.name,
        department: input.department,
        purchasePrice: input.purchasePrice,
        salePrice: input.salePrice,
        quantity: input.quantity,
      }).returning();
      return result[0];
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        department: z.enum(["lounge", "oven"]).optional(),
        purchasePrice: z.number().positive().optional(),
        salePrice: z.number().positive().optional(),
        quantity: z.number().int().nullable().optional(),
        minQuantity: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      const result = await db.update(products).set(updates).where(eq(products.id, id)).returning();
      return result[0];
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  bulkUpdatePrice: publicQuery
    .input(
      z.object({
        department: z.enum(["lounge", "oven"]),
        percentage: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const deptProducts = await db
        .select()
        .from(products)
        .where(eq(products.department, input.department));
      
      const multiplier = 1 + input.percentage / 100;
      
      for (const product of deptProducts) {
        await db
          .update(products)
          .set({ salePrice: Math.round(product.salePrice * multiplier * 100) / 100 })
          .where(eq(products.id, product.id));
      }
      
      return { updated: deptProducts.length };
    }),
});
