import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { TopBar } from "@/components/TopBar";
import { ContentCard } from "@/components/ContentCard";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Product = RouterOutput["product"]["list"][number];
import {
  Package,
  ClipboardList,
  Search,
  Plus,
  Percent,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

type Tab = "products" | "inventory";
type DeptFilter = "all" | "lounge" | "oven";
type StockFilter = "all" | "available" | "low" | "out";

interface ProductForm {
  id?: number;
  name: string;
  department: "lounge" | "oven";
  purchasePrice: string;
  salePrice: string;
  quantity: string;
}

const emptyForm: ProductForm = {
  name: "",
  department: "lounge",
  purchasePrice: "",
  salePrice: "",
  quantity: "",
};

export default function Products() {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<DeptFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [pricePercent, setPricePercent] = useState("");
  const [priceDept, setPriceDept] = useState<"lounge" | "oven">("lounge");

  const utils = trpc.useUtils();
  const { data: allProducts } = trpc.product.list.useQuery(
    activeTab === "products"
      ? { search: search || undefined }
      : undefined
  );

  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.dashboard.lowStock.invalidate();
      toast.success("تم إضافة المنتج بنجاح");
      closeModal();
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة المنتج"),
  });

  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.dashboard.lowStock.invalidate();
      toast.success("تم تحديث المنتج بنجاح");
      closeModal();
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث المنتج"),
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.dashboard.lowStock.invalidate();
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء حذف المنتج"),
  });

  const bulkUpdatePrice = trpc.product.bulkUpdatePrice.useMutation({
    onSuccess: (data) => {
      utils.product.list.invalidate();
      toast.success(`تم تحديث أسعار ${data.updated} منتج`);
      setShowPriceModal(false);
      setPricePercent("");
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الأسعار"),
  });

  const updateStock = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.dashboard.lowStock.invalidate();
      toast.success("تم تحديث المخزون");
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setForm({
      id: product.id,
      name: product.name,
      department: product.department,
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
      quantity: product.quantity !== null ? String(product.quantity) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      department: form.department,
      purchasePrice: parseFloat(form.purchasePrice),
      salePrice: parseFloat(form.salePrice),
      quantity: form.department === "lounge" ? parseInt(form.quantity) || 0 : null,
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data });
    } else {
      createProduct.mutate(data);
    }
  };

  const handleBulkPrice = () => {
    const pct = parseFloat(pricePercent);
    if (isNaN(pct)) return;
    bulkUpdatePrice.mutate({ department: priceDept, percentage: pct });
  };

  const filteredProducts = (allProducts as Product[] | undefined)?.filter((p: Product) => {
    if (deptFilter !== "all" && p.department !== deptFilter) return false;
    if (activeTab === "inventory") {
      if (p.department === "oven") return false;
      if (stockFilter === "available" && (p.quantity ?? 0) <= 5) return false;
      if (stockFilter === "low" && ((p.quantity ?? 0) === 0 || (p.quantity ?? 0) > 5)) return false;
      if (stockFilter === "out" && (p.quantity ?? 0) !== 0) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-cream mr-56 font-cairo">
      <TopBar title="المنتجات والمخزون" />
      <div className="p-8">
        {/* Tabs */}
        <div className="bg-white border-b border-[rgba(62,39,35,0.08)] flex items-center mb-6">
          <button
            onClick={() => setActiveTab("products")}
            className={cn(
              "flex items-center gap-2 px-6 py-4 border-b-[3px] transition-all font-semibold text-sm font-cairo",
              activeTab === "products"
                ? "border-teal-700 text-teal-700"
                : "border-transparent text-brown-500 hover:text-brown-700"
            )}
          >
            <Package className="w-5 h-5" />
            قائمة المنتجات
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={cn(
              "flex items-center gap-2 px-6 py-4 border-b-[3px] transition-all font-semibold text-sm font-cairo",
              activeTab === "inventory"
                ? "border-teal-700 text-teal-700"
                : "border-transparent text-brown-500 hover:text-brown-700"
            )}
          >
            <ClipboardList className="w-5 h-5" />
            المخزون
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المنتج..."
              className="w-full h-10 pl-12 pr-4 bg-white border border-[rgba(62,39,35,0.08)] rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all text-sm"
            />
          </div>

          {activeTab === "products" && (
            <>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 text-white rounded-md font-semibold text-sm font-cairo hover:bg-teal-600 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                منتج جديد
              </button>
              <button
                onClick={() => setShowPriceModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-teal-700 text-teal-700 rounded-md font-semibold text-sm font-cairo hover:bg-teal-50 transition-colors"
              >
                <Percent className="w-4 h-4" />
                تعديل الأسعار
              </button>
            </>
          )}

          {activeTab === "inventory" && (
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="h-10 px-4 bg-white border border-[rgba(62,39,35,0.08)] rounded-md text-brown-900 font-cairo focus:border-teal-700 outline-none text-sm"
            >
              <option value="all">الكل</option>
              <option value="available">متوفر</option>
              <option value="low">أوشك على النفاد</option>
              <option value="out">نفذ</option>
            </select>
          )}

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value as DeptFilter)}
            className="h-10 px-4 bg-white border border-[rgba(62,39,35,0.08)] rounded-md text-brown-900 font-cairo focus:border-teal-700 outline-none text-sm"
          >
            <option value="all">كل الأقسام</option>
            <option value="lounge">الاستراحة</option>
            <option value="oven">الفرن</option>
          </select>
        </div>

        {/* Table */}
        <ContentCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brown-100">
                  <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                    اسم المنتج
                  </th>
                  <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                    القسم
                  </th>
                  {activeTab === "products" && (
                    <>
                      <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                        سعر الشراء
                      </th>
                      <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                        سعر المبيع
                      </th>
                    </>
                  )}
                  <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                    الكمية
                  </th>
                  {activeTab === "inventory" && (
                    <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                      الحالة
                    </th>
                  )}
                  {activeTab === "products" && (
                    <th className="text-xs font-semibold text-brown-500 uppercase tracking-wider py-3 px-4 text-right font-cairo">
                      الإجراءات
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredProducts && filteredProducts.length > 0 ? (
                  (filteredProducts as Product[]).map((product: Product) => (
                    <tr
                      key={product.id}
                      className="border-b border-[rgba(62,39,35,0.08)] hover:bg-[rgba(224,242,241,0.3)] transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-semibold text-brown-900 font-cairo">
                        {product.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex px-3 py-1 rounded-full text-xs font-semibold font-cairo",
                            product.department === "lounge"
                              ? "bg-teal-50 text-teal-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {product.department === "lounge" ? "استراحة" : "فرن"}
                        </span>
                      </td>
                      {activeTab === "products" && (
                        <>
                          <td className="py-3 px-4 text-sm text-brown-500 font-cairo">
                            {formatCurrency(product.purchasePrice)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-teal-700 font-cairo">
                            {formatCurrency(product.salePrice)}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-sm font-medium font-cairo">
                        {activeTab === "inventory" && product.department === "lounge" ? (
                          <input
                            type="number"
                            defaultValue={product.quantity ?? 0}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== product.quantity) {
                                updateStock.mutate({ id: product.id, quantity: val });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-20 h-8 px-2 border border-brown-300 rounded text-right text-sm font-cairo focus:border-teal-700 focus:ring-2 focus:ring-teal-50 outline-none"
                          />
                        ) : (
                          <span className={cn(
                            "font-cairo",
                            product.quantity === null ? "text-brown-300" :
                            (product.quantity ?? 0) === 0 ? "text-red-700 font-semibold" :
                            (product.quantity ?? 0) <= 5 ? "text-amber-700 font-semibold" :
                            "text-brown-700"
                          )}>
                            {product.quantity === null ? "—" : product.quantity}
                          </span>
                        )}
                      </td>
                      {activeTab === "inventory" && (
                        <td className="py-3 px-4">
                          {product.department === "lounge" && (
                            <span
                              className={cn(
                                "inline-flex px-3 py-1 rounded-full text-xs font-semibold font-cairo",
                                (product.quantity ?? 0) === 0
                                  ? "bg-red-50 text-red-700"
                                  : (product.quantity ?? 0) <= 5
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-teal-50 text-teal-700"
                              )}
                            >
                              {(product.quantity ?? 0) === 0
                                ? "نفذ"
                                : (product.quantity ?? 0) <= 5
                                ? "أوشك على النفاد"
                                : "متوفر"}
                            </span>
                          )}
                        </td>
                      )}
                      {activeTab === "products" && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(product)}
                              className="w-8 h-8 rounded-md hover:bg-brown-100 flex items-center justify-center transition-colors"
                            >
                              <Pencil className="w-4 h-4 text-teal-700" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
                                  deleteProduct.mutate({ id: product.id });
                                }
                              }}
                              className="w-8 h-8 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-700" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={activeTab === "products" ? 6 : 5} className="py-8 text-center text-sm text-brown-500 font-cairo">
                      لا توجد منتجات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: "rgba(62, 39, 35, 0.3)", backdropFilter: "blur(2px)" }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-[14px] shadow-[0_8px_24px_rgba(62,39,35,0.08)] max-w-md w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[rgba(62,39,35,0.08)]">
              <h3 className="text-base font-semibold text-brown-900 font-cairo">
                {editingProduct ? "تعديل منتج" : "منتج جديد"}
              </h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-md hover:bg-brown-100 flex items-center justify-center">
                <X className="w-5 h-5 text-brown-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brown-900 mb-2 font-cairo">
                  اسم المنتج
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full h-11 px-4 border border-brown-300 rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-brown-900 mb-2 font-cairo">
                  القسم
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value as "lounge" | "oven" })}
                  className="w-full h-11 px-4 border border-brown-300 rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all"
                >
                  <option value="lounge">الاستراحة</option>
                  <option value="oven">الفرن</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brown-900 mb-2 font-cairo">
                    سعر الشراء
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    required
                    className="w-full h-11 px-4 border border-brown-300 rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brown-900 mb-2 font-cairo">
                    سعر المبيع
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    required
                    className="w-full h-11 px-4 border border-brown-300 rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all"
                  />
                </div>
              </div>

              {form.department === "lounge" && (
                <div>
                  <label className="block text-sm font-semibold text-brown-900 mb-2 font-cairo">
                    الكمية الابتدائية
                  </label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    className="w-full h-11 px-4 border border-brown-300 rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-brown-500 font-semibold text-sm font-cairo hover:bg-brown-100 rounded-md transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="px-6 py-2 bg-teal-700 text-white font-semibold text-sm font-cairo rounded-md hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  {createProduct.isPending || updateProduct.isPending ? "جاري..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Price Modal */}
      {showPriceModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: "rgba(62, 39, 35, 0.3)", backdropFilter: "blur(2px)" }}
          onClick={() => setShowPriceModal(false)}
        >
          <div
            className="bg-white rounded-[14px] shadow-[0_8px_24px_rgba(62,39,35,0.08)] max-w-md w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[rgba(62,39,35,0.08)]">
              <h3 className="text-base font-semibold text-brown-900 font-cairo">
                تعديل الأسعار
              </h3>
              <button onClick={() => setShowPriceModal(false)} className="w-8 h-8 rounded-md hover:bg-brown-100 flex items-center justify-center">
                <X className="w-5 h-5 text-brown-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-brown-700 font-cairo">
                رفع أسعار المبيع لجميع منتجات القسم المحدد بنسبة موحدة
              </p>

              <div>
                <label className="block text-sm font-semibold text-brown-900 mb-2 font-cairo">
                  النسبة (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={pricePercent}
                    onChange={(e) => setPricePercent(e.target.value)}
                    placeholder="مثال: 10"
                    className="w-full h-11 px-4 border border-brown-300 rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-500 font-cairo">%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setPriceDept("lounge"); handleBulkPrice(); }}
                  disabled={bulkUpdatePrice.isPending || !pricePercent}
                  className="flex-1 py-2.5 bg-teal-700 text-white rounded-md font-semibold text-sm font-cairo hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  تطبيق على الاستراحة
                </button>
                <button
                  onClick={() => { setPriceDept("oven"); handleBulkPrice(); }}
                  disabled={bulkUpdatePrice.isPending || !pricePercent}
                  className="flex-1 py-2.5 bg-amber-700 text-white rounded-md font-semibold text-sm font-cairo hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  تطبيق على الفرن
                </button>
              </div>

              <p className="text-xs text-amber-700 font-cairo">
                تنبيه: هذا التعديل سيتم على جميع منتجات القسم المحدد
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
