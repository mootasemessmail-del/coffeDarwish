import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { TopBar } from "@/components/TopBar";
import { ContentCard } from "@/components/ContentCard";
import { formatCurrency, getTodayRange, getWeekRange, getMonthRange } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Download,
} from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type DeptSales = RouterOutput["report"]["byDepartment"][number];
type TopProduct = RouterOutput["report"]["topProducts"][number];
type ReportTransaction = RouterOutput["report"]["transactionDetails"][number];
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Period = "today" | "week" | "month" | "custom";

export default function Reports() {
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const dateRange = useMemo(() => {
    switch (period) {
      case "today":
        return getTodayRange();
      case "week":
        return getWeekRange();
      case "month":
        return getMonthRange();
      case "custom":
        return {
          fromDate: customFrom || getTodayRange().fromDate,
          toDate: customTo || getTodayRange().toDate,
        };
    }
  }, [period, customFrom, customTo]);

  const { data: summary } = trpc.report.summary.useQuery(dateRange);
  const { data: byDepartment } = trpc.report.byDepartment.useQuery(dateRange);
  const { data: topProducts } = trpc.report.topProducts.useQuery(dateRange);
  const { data: transactions } = trpc.report.transactionDetails.useQuery({
    ...dateRange,
    limit: 50,
    offset: 0,
  });

  const donutData = (byDepartment as DeptSales[] | undefined)?.map((d: DeptSales) => ({
    name: d.department === "lounge" ? "الاستراحة" : "الفرن",
    value: d.total,
  })) ?? [];

  const COLORS = ["#00796B", "#F57F17"];

  const barData = (topProducts as TopProduct[] | undefined)?.map((p: TopProduct) => ({
    name: p.productName,
    quantity: p.totalQty,
  })) ?? [];

  const handleExportCSV = () => {
    if (!transactions) return;
    const headers = ["رقم الفاتورة", "التاريخ", "القسم", "الإجمالي", "الحالة", "الربح"];
    const rows = transactions.map((t: ReportTransaction) => [
      t.receiptNumber,
      t.createdAt ? new Date(t.createdAt).toLocaleString("ar-LY") : "—",
      t.department === "lounge" ? "استراحة" : "فرن",
      t.totalAmount,
      t.isPaid ? "مسدد" : "دين",
      t.profit,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report_${dateRange.fromDate}_${dateRange.toDate}.csv`;
    link.click();
  };

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "اليوم" },
    { key: "week", label: "هذا الأسبوع" },
    { key: "month", label: "هذا الشهر" },
    { key: "custom", label: "فترة مخصصة" },
  ];

  return (
    <div className="min-h-screen bg-cream mr-56 font-cairo">
      <TopBar title="التقارير المالية" />
      <div className="p-8">
        {/* Period Selector */}
        <div className="bg-white border-b border-[rgba(62,39,35,0.08)] p-4 flex items-center gap-3 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-4 py-2 rounded-md font-semibold text-sm font-cairo transition-all",
                period === p.key
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-brown-500 hover:bg-brown-100"
              )}
            >
              {p.label}
            </button>
          ))}

          {period === "custom" && (
            <div className="flex items-center gap-2 mr-4">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 px-3 border border-brown-300 rounded-md text-sm font-cairo focus:border-teal-700 outline-none"
              />
              <span className="text-brown-500">إلى</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 px-3 border border-brown-300 rounded-md text-sm font-cairo focus:border-teal-700 outline-none"
              />
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <motion.div
          className="grid grid-cols-3 gap-5 mt-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          {[
            {
              label: "إجمالي المبيعات",
              value: formatCurrency(summary?.totalSales ?? 0),
              icon: Wallet,
              iconBg: "bg-teal-50",
              iconColor: "text-teal-700",
              valueColor: "text-teal-700",
            },
            {
              label: "الربح التقديري",
              value: formatCurrency(summary?.estimatedProfit ?? 0),
              icon: TrendingUp,
              iconBg: "bg-teal-50",
              iconColor: "text-teal-700",
              valueColor: "text-teal-700",
            },
            {
              label: "عدد الفواتير",
              value: String(summary?.transactionCount ?? 0),
              icon: Receipt,
              iconBg: "bg-brown-100",
              iconColor: "text-brown-700",
              valueColor: "text-brown-900",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
            >
              <ContentCard>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.iconBg)}>
                  <stat.icon className={cn("w-6 h-6", stat.iconColor)} />
                </div>
                <p className={cn("text-2xl font-bold mt-3 font-cairo", stat.valueColor)}>
                  {stat.value}
                </p>
                <p className="text-sm text-brown-500 mt-1 font-cairo">{stat.label}</p>
              </ContentCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div
          className="grid grid-cols-2 gap-5 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <ContentCard header={<h3 className="text-base font-semibold text-brown-900 font-cairo">المبيعات حسب القسم</h3>}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {donutData.map((_d: typeof donutData[0], index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      fontFamily: "Cairo",
                      borderRadius: 8,
                      border: "1px solid rgba(62,39,35,0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ContentCard>

          <ContentCard header={<h3 className="text-base font-semibold text-brown-900 font-cairo">أكثر المنتجات مبيعاً</h3>}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,39,35,0.08)" />
                  <XAxis type="number" tick={{ fontFamily: "Cairo", fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontFamily: "Cairo", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      fontFamily: "Cairo",
                      borderRadius: 8,
                      border: "1px solid rgba(62,39,35,0.08)",
                    }}
                  />
                  <Bar dataKey="quantity" fill="#00796B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ContentCard>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.2 }}
        >
          <ContentCard
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-base font-semibold text-brown-900 font-cairo">تفاصيل المعاملات</h3>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-1.5 border border-teal-700 text-teal-700 rounded-md font-semibold text-xs font-cairo hover:bg-teal-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  تصدير CSV
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr className="bg-brown-100">
                    <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                      رقم الفاتورة
                    </th>
                    <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                      التاريخ
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
                      الربح التقديري
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions && transactions.length > 0 ? (
                    (transactions as ReportTransaction[]).map((tx: ReportTransaction) => (
                      <tr
                        key={tx.id}
                        className="border-b border-[rgba(62,39,35,0.08)] hover:bg-[rgba(224,242,241,0.3)] transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-semibold text-brown-900 font-cairo">
                          #{tx.receiptNumber}
                        </td>
                        <td className="py-3 px-4 text-sm text-brown-500 font-cairo">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("ar-LY") : "—"}
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
                        <td className="py-3 px-4 text-sm font-medium text-teal-700 font-cairo">
                          {formatCurrency(tx.profit)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-brown-500 font-cairo">
                        لا توجد معاملات في هذه الفترة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </motion.div>
      </div>
    </div>
  );
}
