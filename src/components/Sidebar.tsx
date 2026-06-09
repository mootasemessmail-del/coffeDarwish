import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Calculator,
  Package,
  BarChart3,
  Receipt,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { path: "/pos", label: "الكاش", icon: Calculator },
  { path: "/products", label: "المنتجات", icon: Package },
  { path: "/expenses", label: "المصروفات", icon: Receipt },
  { path: "/reports", label: "التقارير", icon: BarChart3 },
];

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="fixed right-0 top-0 h-screen w-56 bg-brown-900 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <h1 className="text-xl font-bold text-[#FDF8F0] font-cairo">استراحة درويش</h1>
        <p className="text-xs text-[#BCAAA4] mt-1 font-cairo">نظام المحاسبة</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-150 ease-out font-cairo",
                isActive
                  ? "bg-teal-700 text-white"
                  : "text-[#BCAAA4] hover:bg-[rgba(253,248,240,0.06)]"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-md text-red-400 hover:bg-[rgba(255,235,238,0.1)] transition-all duration-150 w-full font-cairo"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="font-semibold text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
