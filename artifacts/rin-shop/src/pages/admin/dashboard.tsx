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
  AlertCircle,
  Bot,
  MessageSquare,
  Palette,
  Bell,
  Save
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface BotConfig {
  welcomeMessage: string;
  primaryColor: string;
  notificationChannel: string;
  autoRespond: boolean;
  respondDelay: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminDashboard({
    query: { 
      enabled: true,
      queryKey: getGetAdminDashboardQueryKey()
    }
  });

  const queryClient = useQueryClient();
  const [botConfig, setBotConfig] = useState<BotConfig>({
    welcomeMessage: "สวัสดีครับ! ยินดีต้อนรับเข้าสู่เซิร์ฟเวอร์ของเรา 🎉",
    primaryColor: "#3B82F6",
    notificationChannel: "general",
    autoRespond: true,
    respondDelay: 1000,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch bot config on mount
  useEffect(() => {
    const fetchBotConfig = async () => {
      try {
        const response = await fetch("/api/admin/bot-config");
        if (response.ok) {
          const data = await response.json();
          setBotConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch bot config:", error);
      }
    };
    fetchBotConfig();
  }, []);

  const handleBotConfigChange = (field: keyof BotConfig, value: any) => {
    setBotConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBotConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(botConfig),
      });
      
      if (response.ok) {
        const data = await response.json();
        setBotConfig(data);
        toast.success("บันทึกการตั้งค่าบอทสำเร็จ ✅");
        queryClient.invalidateQueries({ queryKey: ["botConfig"] });
      } else {
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error saving bot config:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  if (statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
      case OrderStatus.completed: return <Badge variant="outline" className="bg-green-50 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1"/> เสร็จส���้น</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <Card className={`rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} rounded-full z-0 opacity-50`}></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white`} style={{backgroundColor: color.replace('50', '100')}}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-gray-800 mb-1">{value}</div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
      </CardContent>
    </Card>
  );

  const SectionCard = ({ icon: Icon, title, children }: any) => (
    <Card className="rounded-2xl border-0 shadow-sm bg-white mb-6">
      <CardHeader className="pb-3 pt-5 px-6 border-b border-gray-100">
        <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="w-4 h-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-5">{children}</CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-gray-500 mt-2">ยินดีต้อนรับกลับมา ริน! สรุปข้อมูลภาพรวมของร้านวันนี้</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} title="รายได้ทั้งหมด" value={`฿${stats.totalRevenue.toLocaleString()}`} color="bg-green-50" />
        <StatCard icon={ShoppingBag} title="ออเดอร์ทั้งหมด" value={stats.totalOrders} color="bg-blue-50" />
        <StatCard icon={AlertCircle} title="รอชำระเงิน/กำลังทำ" value={stats.pendingOrders} color="bg-orange-50" />
        <StatCard icon={Users} title="สมาชิกรวม" value={stats.totalUsers} color="bg-purple-50" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Orders (2/3) */}
        <div className="lg:col-span-2">
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

        {/* Right Column - Bot Configuration (1/3) */}
        <div>
          <SectionCard icon={Bot} title="ตั้งค่าบอท">
            <div className="space-y-4">
              {/* Welcome Message */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> ข้อความต้อนรับ
                </Label>
                <Textarea
                  value={botConfig.welcomeMessage}
                  onChange={(e) => handleBotConfigChange('welcomeMessage', e.target.value)}
                  className="rounded-lg resize-none text-sm h-20"
                  placeholder="ข้อความต้อนรับสมาชิกใหม่..."
                />
              </div>

              {/* Color Picker */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> สีหลัก
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={botConfig.primaryColor}
                    onChange={(e) => handleBotConfigChange('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
                  />
                  <Input
                    value={botConfig.primaryColor}
                    onChange={(e) => handleBotConfigChange('primaryColor', e.target.value)}
                    className="rounded-lg text-sm flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* Notification Channel */}
              <div>
                <Label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4" /> ช่องแจ้งเตือน
                </Label>
                <Input
                  value={botConfig.notificationChannel}
                  onChange={(e) => handleBotConfigChange('notificationChannel', e.target.value)}
                  className="rounded-lg text-sm"
                  placeholder="general"
                />
              </div>

              {/* Auto Respond */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={botConfig.autoRespond}
                  onChange={(e) => handleBotConfigChange('autoRespond', e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  id="autoRespond"
                />
                <Label htmlFor="autoRespond" className="text-sm font-semibold text-gray-600 cursor-pointer">
                  ตอบกลับอัตโนมัติก้
                </Label>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveBotConfig}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold py-2 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
