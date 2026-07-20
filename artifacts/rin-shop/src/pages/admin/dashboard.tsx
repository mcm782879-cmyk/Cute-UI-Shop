import { Link } from "wouter";
import { 
  useGetAdminDashboard,
  getGetAdminDashboardQueryKey,
  OrderStatus 
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { 
  ShoppingBag, 
  CreditCard, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminDashboard({
    query: { 
      enabled: true,
      queryKey: getGetAdminDashboardQueryKey()
    }
  });

  if (statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!stats) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.pending: return <Badge variant="outline" className="bg-orange-50 text-orange-600"><AlertCircle className="w-3 h-3 mr-1"/> รอชำระเงิน</Badge>;
      case OrderStatus.paid: return <Badge variant="outline" className="bg-blue-50 text-blue-600"><CreditCard className="w-3 h-3 mr-1"/> แจ้งโอนแล้ว</Badge>;
      case OrderStatus.processing: return <Badge variant="outline" className="bg-purple-50 text-purple-600"><Clock className="w-3 h-3 mr-1"/> กำลังทำ</Badge>;
      case OrderStatus.completed: return <Badge variant="outline" className="bg-green-50 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1"/> เสร็จสิ้น</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="text-gray-500">ยินดีต้อนรับกลับมา ริน! สรุปข้อมูลภาพรวมของร้านวันนี้</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full z-0 opacity-50"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-800 mb-1">฿{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm font-medium text-gray-500">รายได้ทั้งหมด</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full z-0 opacity-50"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-800 mb-1">{stats.totalOrders}</div>
            <div className="text-sm font-medium text-gray-500">ออเดอร์ทั้งหมด</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full z-0 opacity-50"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-800 mb-1">{stats.pendingOrders}</div>
            <div className="text-sm font-medium text-gray-500">รอชำระเงิน/กำลังทำ</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full z-0 opacity-50"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-800 mb-1">{stats.totalUsers}</div>
            <div className="text-sm font-medium text-gray-500">สมาชิกรวม</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-0 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-gray-100 flex flex-row items-center justify-between bg-gray-50/50">
          <CardTitle className="text-lg font-bold text-gray-800">ออเดอร์ล่าสุด</CardTitle>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline flex items-center">
            ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">รหัส</th>
                <th className="px-6 py-4">ลูกค้า</th>
                <th className="px-6 py-4">แพ็กเกจ</th>
                <th className="px-6 py-4">ราคา</th>
                <th className="px-6 py-4">วันที่</th>
                <th className="px-6 py-4">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    ยังไม่มีออเดอร์
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{order.id.toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{order.user?.username}</div>
                      <div className="text-xs text-gray-500">{order.discordUsername}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.package?.name || '-'}</td>
                    <td className="px-6 py-4 font-medium">฿{(order.totalPrice || order.package?.price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">{format(new Date(order.createdAt), "dd MMM yyyy", { locale: th })}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
