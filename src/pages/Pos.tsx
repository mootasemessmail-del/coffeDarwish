import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Product = RouterOutput["product"]["list"][number];
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  Flame,
  Search,
  Banknote,
  BookOpen,
  Printer,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
interface ReceiptItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  isOvenProduct: boolean;
}

export default function Pos() {
  const [activeDept, setActiveDept] = useState<"lounge" | "oven">("lounge");
  const [search, setSearch] = useState("");
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [paymentType, setPaymentType] = useState<"cash" | "debt">("cash");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const { data: products } = trpc.product.list.useQuery({
    department: activeDept,
    search: search || undefined,
  });

  const utils = trpc.useUtils();
  const createTransaction = trpc.transaction.create.useMutation({
    onSuccess: () => {
      utils.dashboard.stats.invalidate();
      utils.dashboard.recentTransactions.invalidate();
      utils.dashboard.lowStock.invalidate();
      toast.success("تم حفظ الفاتورة بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ الفاتورة");
    },
  });

  const addToReceipt = (product: any) => {
    if (activeDept === "lounge" && product.quantity === 0) {
      toast("المنتج نفذ من المخزون — يمكنك البيع مع التحذير", {
        icon: <AlertTriangle className="w-4 h-4 text-amber-700" />,
      });
    }

    setReceiptItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.salePrice,
          quantity: 1,
          isOvenProduct: product.department === "oven",
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setReceiptItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setReceiptItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearReceipt = () => {
    setReceiptItems([]);
    setPaymentType("cash");
  };

  const total = useMemo(
    () => receiptItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [receiptItems]
  );

  const handlePrint = () => {
    if (receiptItems.length === 0) return;

    const items = receiptItems.map((item) => ({
      productId: item.productId,
      productName: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
      totalPrice: item.price * item.quantity,
      isOvenProduct: item.isOvenProduct,
    }));

    createTransaction.mutate(
      {
        department: activeDept,
        totalAmount: total,
        paymentType,
        items,
      },
      {
        onSuccess: (data) => {
          setLastTransaction(data);
          setShowPrintPreview(true);
          clearReceipt();
        },
      }
    );
  };

  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="h-screen flex mr-56 bg-cream font-cairo">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Department Tabs */}
        <div className="h-14 bg-white border-b border-[rgba(62,39,35,0.08)] flex items-center px-6">
          <button
            onClick={() => setActiveDept("lounge")}
            className={cn(
              "flex items-center gap-2 px-6 h-full border-b-[3px] transition-all duration-150 font-semibold text-sm font-cairo",
              activeDept === "lounge"
                ? "border-teal-700 text-teal-700"
                : "border-transparent text-brown-500 hover:text-brown-700"
            )}
          >
            <Coffee className="w-5 h-5" />
            الاستراحة
          </button>
          <button
            onClick={() => setActiveDept("oven")}
            className={cn(
              "flex items-center gap-2 px-6 h-full border-b-[3px] transition-all duration-150 font-semibold text-sm font-cairo",
              activeDept === "oven"
                ? "border-amber-700 text-amber-700"
                : "border-transparent text-brown-500 hover:text-brown-700"
            )}
          >
            <Flame className="w-5 h-5" />
            الفرن
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المنتج..."
              className="w-full h-12 pl-12 pr-4 bg-white border border-[rgba(62,39,35,0.08)] rounded-[10px] text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all duration-150"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDept + search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3"
            >
              {(products as Product[] | undefined)?.map((product: Product) => {
                const isOutOfStock =
                  activeDept === "lounge" && product.quantity === 0;
                const isLowStock =
                  activeDept === "lounge" &&
                  product.quantity !== null &&
                  product.quantity > 0 &&
                  product.quantity <= 5;

                return (
                  <button
                    key={product.id}
                    onClick={() => addToReceipt(product)}
                    disabled={isOutOfStock}
                    className={cn(
                      "bg-white border rounded-[10px] p-4 text-center transition-all duration-150 font-cairo",
                      isOutOfStock
                        ? "opacity-50 cursor-not-allowed border-[rgba(62,39,35,0.08)]"
                        : "border-[rgba(62,39,35,0.08)] hover:shadow-[0_4px_12px_rgba(62,39,35,0.06)] hover:border-teal-700/30 hover:-translate-y-0.5 active:scale-[0.98] active:shadow-[0_1px_3px_rgba(62,39,35,0.04)]",
                      isLowStock && !isOutOfStock && "border-t-[3px] border-t-amber-700"
                    )}
                  >
                    <p className="text-base font-semibold text-brown-900 font-cairo">
                      {product.name}
                    </p>
                    <p className="text-sm font-medium text-teal-700 mt-2 font-cairo">
                      {formatCurrency(product.salePrice)}
                    </p>
                    {activeDept === "lounge" && product.quantity !== null && (
                      <p
                        className={cn(
                          "text-xs mt-1 font-cairo",
                          product.quantity <= 5 ? "text-amber-700" : "text-brown-500"
                        )}
                      >
                        مخزون: {product.quantity}
                      </p>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Receipt Panel */}
      <div className="w-80 bg-white border-r border-[rgba(62,39,35,0.08)] shadow-[0_8px_24px_rgba(62,39,35,0.08)] flex flex-col h-screen">
        {/* Header */}
        <div className="p-6 border-b border-[rgba(62,39,35,0.08)]">
          <h3 className="text-base font-semibold text-brown-900 font-cairo">
            الفاتورة الحالية
          </h3>
          <p className="text-sm text-brown-500 mt-1 font-cairo">فاتورة جديدة</p>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {receiptItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-brown-300">
              <ShoppingCart className="w-12 h-12 mb-3" />
              <p className="text-sm font-cairo">لا توجد منتجات</p>
            </div>
          ) : (
            <div className="space-y-1">
              {receiptItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between py-2 border-b border-dashed border-brown-300 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brown-900 font-cairo truncate">
                        {item.name}
                      </span>
                      <span className="text-xs font-semibold text-brown-500 bg-brown-100 px-2 py-0.5 rounded-full">
                        ×{item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded-full bg-brown-100 flex items-center justify-center hover:bg-brown-300 transition-colors"
                      >
                        <Minus className="w-3 h-3 text-brown-700" />
                      </button>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded-full bg-brown-100 flex items-center justify-center hover:bg-brown-300 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-brown-700" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors mr-2"
                      >
                        <Trash2 className="w-3 h-3 text-red-700" />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-brown-700 font-cairo mr-4">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-[rgba(62,39,35,0.08)]">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-brown-900 font-cairo">الإجمالي</span>
            <span className="text-xl font-bold text-brown-900 font-cairo">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Payment Type */}
        <div className="px-6 pb-4 flex gap-3">
          <button
            onClick={() => setPaymentType("cash")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm font-cairo transition-all duration-150",
              paymentType === "cash"
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-transparent border border-teal-700 text-teal-700 hover:bg-teal-50"
            )}
          >
            <Banknote className="w-4 h-4" />
            كاش
          </button>
          <button
            onClick={() => setPaymentType("debt")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm font-cairo transition-all duration-150",
              paymentType === "debt"
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-transparent border border-teal-700 text-teal-700 hover:bg-teal-50"
            )}
          >
            <BookOpen className="w-4 h-4" />
            دين
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handlePrint}
            disabled={receiptItems.length === 0 || createTransaction.isPending}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm font-cairo transition-all duration-150",
              receiptItems.length === 0 || createTransaction.isPending
                ? "bg-brown-300 text-white cursor-not-allowed"
                : "bg-teal-700 text-white hover:bg-teal-600 shadow-sm active:scale-[0.98]"
            )}
          >
            {createTransaction.isPending ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
            طباعة الفاتورة
          </button>
          <button
            onClick={clearReceipt}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm text-brown-500 font-cairo hover:bg-brown-100 transition-all duration-150"
          >
            <X className="w-5 h-5" />
            إلغاء
          </button>
        </div>
      </div>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {showPrintPreview && lastTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backgroundColor: "rgba(62, 39, 35, 0.3)", backdropFilter: "blur(2px)" }}
            onClick={() => setShowPrintPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-[14px] shadow-[0_8px_24px_rgba(62,39,35,0.08)] max-w-md w-[90vw] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Receipt Print Area */}
              <div className="receipt-print p-6" style={{ width: "320px", margin: "0 auto" }}>
                <h2 className="text-center text-lg font-bold text-brown-900 font-cairo">
                  استراحة درويش
                </h2>
                <div className="border-b border-dashed border-brown-300 my-3" />
                <p className="text-center text-sm text-brown-700 font-cairo">
                  فاتورة #{lastTransaction.receiptNumber}
                </p>
                <p className="text-center text-xs text-brown-500 font-cairo mt-1">
                  {new Date(lastTransaction.createdAt).toLocaleString("ar-LY")}
                </p>
                <div className="border-b border-dashed border-brown-300 my-3" />

                <table className="w-full text-sm font-cairo">
                  <thead>
                    <tr className="text-brown-500 text-xs">
                      <th className="text-right pb-2">المنتج</th>
                      <th className="text-center pb-2">الكمية</th>
                      <th className="text-center pb-2">السعر</th>
                      <th className="text-left pb-2">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* We'd need to fetch items separately, showing placeholder */}
                    <tr>
                      <td colSpan={4} className="text-center text-xs text-brown-500 py-2">
                        فاتورة بقيمة {formatCurrency(lastTransaction.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-b border-dashed border-brown-300 my-3" />
                <div className="flex justify-between text-sm font-cairo">
                  <span className="font-semibold text-brown-900">الإجمالي:</span>
                  <span className="font-bold text-brown-900">
                    {formatCurrency(lastTransaction.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-cairo mt-1">
                  <span className="text-brown-700">طريقة الدفع:</span>
                  <span className="font-semibold text-brown-900">
                    {lastTransaction.paymentType === "cash" ? "كاش" : "دين"}
                  </span>
                </div>
                <div className="border-b border-dashed border-brown-300 my-3" />
                <p className="text-center text-xs text-brown-500 font-cairo">
                  شكراً لزيارتكم
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[rgba(62,39,35,0.08)] flex gap-3 justify-end">
                <button
                  onClick={handleDirectPrint}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-md font-semibold text-sm font-cairo hover:bg-teal-600 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 border border-teal-700 text-teal-700 rounded-md font-semibold text-sm font-cairo hover:bg-teal-50 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
