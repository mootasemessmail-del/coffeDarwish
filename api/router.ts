import { createRouter, publicQuery } from "./middleware";
import { productRouter } from "./routers/product";
import { transactionRouter } from "./routers/transaction";
import { expenseRouter } from "./routers/expense";
import { dashboardRouter } from "./routers/dashboard";
import { reportRouter } from "./routers/report";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  product: productRouter,
  transaction: transactionRouter,
  dashboard: dashboardRouter,
  report: reportRouter,
  expense: expenseRouter,

});

export type AppRouter = typeof appRouter;
