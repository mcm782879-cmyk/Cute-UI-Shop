import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, UserCircle, Settings, Menu, X, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout: clearLocalToken } = useAuth();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearLocalToken();
        setLocation("/");
      }
    });
  };

  const navItems = user?.role === "admin" 
    ? [
        { label: "แดชบอร์ด", href: "/admin", icon: LayoutDashboard },
        { label: "ออเดอร์ทั้งหมด", href: "/admin/orders", icon: ShoppingBag },
        { label: "บริการทั้งหมด", href: "/admin/services", icon: Settings },
        { label: "รายการโอนเงิน", href: "/admin/payments", icon: UserCircle },
        { label: "รูปภาพแกลลอรี่", href: "/admin/gallery", icon: Settings },
      ]
    : user 
    ? [
        { label: "ประวัติการสั่งซื้อ", href: "/my-orders", icon: ShoppingBag },
      ]
    : [];

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-purple-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
              ริน
            </div>
            <span className="font-bold text-xl text-primary drop-shadow-sm hidden sm:inline-block">รินจัดให้</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-gray-600 hover:text-primary font-medium transition-colors flex items-center gap-1">
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6 ml-2">
              {user ? (
                <>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-gray-800">{user.username}</span>
                    <span className="text-xs text-gray-500">{user.role === 'admin' ? 'แอดมิน' : 'ลูกค้า'}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-primary font-medium transition-colors">เข้าสู่ระบบ</Link>
                  <Link href="/register">
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-sm">สมัครสมาชิก</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-purple-100 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="text-gray-600 hover:text-primary font-medium transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50">
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{user.username}</div>
                        <div className="text-xs text-gray-500">{user.role === 'admin' ? 'แอดมิน' : 'ลูกค้า'}</div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                      <LogOut className="w-5 h-5 mr-2" />
                      ออกจากระบบ
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">เข้าสู่ระบบ</Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white">สมัครสมาชิก</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="bg-white border-t border-purple-100 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-4">
            ริน
          </div>
          <h3 className="font-bold text-xl text-primary mb-2">รินจัดให้</h3>
          <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
            บริการรับเปิดเซิฟเวอร์, ตั้งค่า Discord, และบอทต่างๆ 
            ด้วยความใส่ใจและเป็นกันเอง เหมือนมีเพื่อนช่วยดูแล
          </p>
          <div className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Rin Jad Hai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
