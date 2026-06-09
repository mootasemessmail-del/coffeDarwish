import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { expenses } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const expenseRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();

    return db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.expenseDate));
  }),

  create: publicQuery
    .input(
      z.object({
        department: z.enum(["lounge", "oven"]),
        description: z.string().min(1),
        amount: z.number().positive(),
        notes: z.string().optional(),
        expenseDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db
        .insert(expenses)
        .values({
          department: input.department,
          description: input.description,
          amount: input.amount,
          notes: input.notes,
          expenseDate: input.expenseDate,
        })
        .returning();

      return result[0];
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .delete(expenses)
        .where(eq(expenses.id, input.id));

      return { success: true };
    }),
});