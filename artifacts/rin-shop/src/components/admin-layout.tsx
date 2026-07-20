import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  CreditCard,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "ภาพรวม", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "ออเดอร์", href: "/admin/orders", icon: ShoppingBag },
  { label: "บริการ & ราคา", href: "/admin/services", icon: Package },
  { label: "ตรวจสลิป", href: "/admin/payments", icon: CreditCard },
  { label: "แกลลอรี่", href: "/admin/gallery", icon: Image },
  { label: "ตั้งค่าเว็บ", href: "/admin/settings", icon: Settings },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout: clearToken } = useAuth();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearToken();
        setLocation("/");
      },
    });
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? location === href : location.startsWith(href);

  return (
    <aside className="w-64 h-full bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
            ริน
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">รินจัดให้</div>
            <div className="text-xs text-slate-400">Admin Panel</div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Admin badge */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
          <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-indigo-300 font-semibold truncate">
              {user?.username}
            </div>
            <div className="text-[10px] text-indigo-400/60">เจ้าของร้าน</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-indigo-300" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <span>← หน้าร้านค้า</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const currentPage = navItems.find((item) =>
    item.exact ? location === item.href : location.startsWith(item.href)
  );

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 h-14 flex items-center px-4 md:px-6 gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{currentPage?.label ?? "Admin"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
              <Shield className="w-3 h-3 text-indigo-500" />
              <span>Admin Mode</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
