import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  department: text("department", { enum: ["lounge", "oven"] }).notNull(),
  purchasePrice: real("purchase_price").notNull(),
  salePrice: real("sale_price").notNull(),
  quantity: integer("quantity"),
  minQuantity: integer("min_quantity").notNull().default(5),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  receiptNumber: integer("receipt_number").notNull().unique(),
  department: text("department", { enum: ["lounge", "oven"] }).notNull(),
  totalAmount: real("total_amount").notNull(),
  paymentType: text("payment_type", { enum: ["cash", "debt"] }).notNull(),
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const transactionItems = sqliteTable("transaction_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id", { mode: "number" })
    .notNull()
    .references(() => transactions.id),
  productId: integer("product_id", { mode: "number" }).references(() => products.id),
  productName: text("product_name").notNull(),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: real("total_price").notNull(),
  isOvenProduct: integer("is_oven_product", { mode: "boolean" }).notNull(),
});
export const expenses = sqliteTable("expenses", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),

  department: text("department", {
    enum: ["lounge", "oven"],
  }).notNull(),

  description: text("description").notNull(),

  amount: real("amount").notNull(),

  notes: text("notes"),

  expenseDate: text("expense_date").notNull(),

  createdAt: integer("created_at", {
    mode: "timestamp",
  }).$defaultFn(() => new Date()),
});