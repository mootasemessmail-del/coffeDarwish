import { trpc } from "@/providers/trpc";
import { TopBar } from "@/components/TopBar";
import { ContentCard } from "@/components/ContentCard";
import { formatCurrency, formatTime } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Wallet,
  Receipt,
  AlertTriangle,
  TrendingUp,
  Eye,
  
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Transaction = RouterOutput["transaction"]["list"][number];
type Product = RouterOutput["product"]["list"][number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function Dashboard() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: recentTxs } = trpc.dashboard.recentTransactions.useQuery();
  const { data: lowStock } = trpc.dashboard.lowStock.useQuery();

  const statItems = [
    {
      label: "إجمالي المبيعات اليوم",
      value: formatCurrency(stats?.todaySales ?? 0),
      icon: Wallet,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-700",
    },
    {
      label: "عدد الفواتير",
      value: String(stats?.todayCount ?? 0),
      icon: Receipt,
      iconBg: "bg-brown-100",
      iconColor: "text-brown-700",
    },
    {
      label: "الديون غير المسددة",
      value: formatCurrency(stats?.unpaidDebts ?? 0),
      icon: AlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-red-700",
    },
    {
      label: "أكثر منتج مبيعاً",
      value: stats?.topProduct ?? "—",
      icon: TrendingUp,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
    },
  ];

  return (
    <div className="min-h-screen bg-cream mr-56">
      <TopBar title="الرئيسية" />
      <div className="p-8">
        <motion.div
          className="grid grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {statItems.map((item, i) => (
            <motion.div key={i} variants={cardVariants}>
              <ContentCard>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", item.iconBg)}>
                  <item.icon className={cn("w-6 h-6", item.iconColor)} />
                </div>
                <p className="text-2xl font-bold text-brown-900 mt-3 font-cairo">
                  {item.value}
                </p>
                <p className="text-sm text-brown-500 mt-1 font-cairo">{item.label}</p>
              </ContentCard>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-[3fr_2fr] gap-5 mt-8">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.2 }}
          >
            <ContentCard
              header={<h3 className="text-base font-semibold text-brown-900 font-cairo">فواتير اليوم</h3>}
            >
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-brown-100">
                      <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                        رقم الفاتورة
                      </th>
                      <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                        الوقت
                      </th>
                      <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                        القسم
                      </th>
                      <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                        الإجمالي
                      </th>
                      <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                        الحالة
                      </th>
                      <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxs && recentTxs.length > 0 ? (
                      (recentTxs as Transaction[]).map((tx: Transaction) => (
                        <tr
                          key={tx.id}
                          className="border-b border-[rgba(62,39,35,0.08)] hover:bg-[rgba(224,242,241,0.3)] transition-colors duration-100"
                        >
                          <td className="py-3 px-4 text-sm font-semibold text-brown-900 font-cairo">
                            #{tx.receiptNumber}
                          </td>
                          <td className="py-3 px-4 text-sm text-brown-500 font-cairo">
                            {tx.createdAt ? formatTime(tx.createdAt) : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                "inline-flex px-3 py-1 rounded-full text-xs font-semibold font-cairo",
                                tx.department === "lounge"
                                  ? "bg-teal-50 text-teal-700"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {tx.department === "lounge" ? "استراحة" : "فرن"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-brown-900 font-cairo">
                            {formatCurrency(tx.totalAmount)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                "inline-flex px-3 py-1 rounded-full text-xs font-semibold font-cairo",
                                tx.isPaid
                                  ? "bg-teal-50 text-teal-700"
                                  : "bg-red-50 text-red-700"
                              )}
                            >
                              {tx.isPaid ? "مسدد" : "دين"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button className="w-8 h-8 rounded-md hover:bg-brown-100 flex items-center justify-center transition-colors">
                              <Eye className="w-4 h-4 text-brown-500" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-brown-500 font-cairo">
                          لا توجد فواتير اليوم
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ContentCard>
          </motion.div>

          {/* Low Stock Alerts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.2 }}
          >
            <ContentCard
              header={<h3 className="text-base font-semibold text-brown-900 font-cairo">تنبيهات المخزون</h3>}
            >
              <div className="space-y-1">
                {lowStock && lowStock.length > 0 ? (
                  (lowStock as Product[]).map((product: Product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-3 border-b border-[rgba(62,39,35,0.08)]"
                    >
                      <span className="text-sm font-semibold text-brown-900 font-cairo">
                        {product.name}
                      </span>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold font-cairo",
                          (product.quantity ?? 0) === 0
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {(product.quantity ?? 0) === 0
                          ? "نفذ"
                          : String(product.quantity)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-brown-500 font-cairo">
                    لا توجد تنبيهات حالياً
                  </p>
                )}
              </div>
            </ContentCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

