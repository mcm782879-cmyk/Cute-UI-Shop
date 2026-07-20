import { useState } from "react";
import { 
  useListOrders, 
  getListOrdersQueryKey,
  useUpdateOrderStatus, 
  Order, 
  OrderStatus,
  OrderStatusUpdateStatus 
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { 
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertCircle,
  XCircle,
  MessageSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminOrders() {
  const { data: orders, isLoading: ordersLoading, refetch } = useListOrders({
    query: { 
      enabled: true,
      queryKey: getListOrdersQueryKey()
    }
  });
  const updateStatus = useUpdateOrderStatus();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatusUpdateStatus | null>(null);

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.discordUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = () => {
    if (!selectedOrder || !newStatus) return;

    updateStatus.mutate({
      id: selectedOrder.id,
      data: {
        status: newStatus,
        adminNote: adminNote || undefined
      }
    }, {
      onSuccess: () => {
        toast.success("อัพเดทสถานะสำเร็จ");
        setSelectedOrder(null);
        setNewStatus(null);
        setAdminNote("");
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || "เกิดข้อผิดพลาดในการอัพเดทสถานะ");
      }
    });
  };

  const openStatusDialog = (order: Order, status: OrderStatusUpdateStatus) => {
    setSelectedOrder(order);
    setNewStatus(status);
    setAdminNote(order.adminNote || "");
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.pending: return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200"><AlertCircle className="w-3 h-3 mr-1"/> รอชำระเงิน</Badge>;
      case OrderStatus.paid: return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200"><CreditCard className="w-3 h-3 mr-1"/> แจ้งโอนแล้ว</Badge>;
      case OrderStatus.processing: return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200"><Clock className="w-3 h-3 mr-1"/> กำลังทำ</Badge>;
      case OrderStatus.completed: return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1"/> เสร็จสิ้น</Badge>;
      case OrderStatus.cancelled: return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1"/> ยกเลิก</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (ordersLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-12 w-full mb-6 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการออเดอร์</h1>
          <p className="text-gray-500">รายการสั่งซื้อทั้งหมดจากลูกค้า</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="ค้นหาชื่อผู้ใช้, Discord, รหัสออเดอร์..." 
            className="pl-10 bg-gray-50 border-transparent rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button 
            variant={statusFilter === "all" ? "default" : "outline"} 
            className={statusFilter === "all" ? "bg-gray-800 text-white rounded-xl" : "rounded-xl"}
            onClick={() => setStatusFilter("all")}
          >
            ทั้งหมด
          </Button>
          <Button 
            variant={statusFilter === OrderStatus.paid ? "default" : "outline"} 
            className={statusFilter === OrderStatus.paid ? "bg-blue-600 text-white rounded-xl hover:bg-blue-700" : "rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"}
            onClick={() => setStatusFilter(OrderStatus.paid)}
          >
            แจ้งโอนแล้ว
          </Button>
          <Button 
            variant={statusFilter === OrderStatus.processing ? "default" : "outline"} 
            className={statusFilter === OrderStatus.processing ? "bg-purple-600 text-white rounded-xl hover:bg-purple-700" : "rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"}
            onClick={() => setStatusFilter(OrderStatus.processing)}
          >
            กำลังทำ
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">รหัส/วันที่</th>
                <th className="px-6 py-4">ลูกค้า</th>
                <th className="px-6 py-4">รายละเอียด</th>
                <th className="px-6 py-4">ยอดชำระ</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Filter className="w-10 h-10 text-gray-300 mb-3" />
                      <p>ไม่พบออเดอร์ที่ค้นหา</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders?.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 mb-1">#{order.id.toString().padStart(4, '0')}</div>
                      <div className="text-xs text-gray-500">{format(new Date(order.createdAt), "dd MMM yy HH:mm", { locale: th })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{order.user?.username}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MessageSquare className="w-3 h-3" /> {order.discordUsername || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-700">{order.package?.name || '-'}</div>
                      {order.note && <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]" title={order.note}>📝 {order.note}</div>}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ฿{(order.totalPrice || order.package?.price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuLabel>เปลี่ยนสถานะ</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openStatusDialog(order, OrderStatusUpdateStatus.processing)}>
                            <Clock className="w-4 h-4 mr-2 text-purple-500" /> รับเรื่อง/กำลังทำ
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusDialog(order, OrderStatusUpdateStatus.completed)}>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> ส่งงาน/เสร็จสิ้น
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusDialog(order, OrderStatusUpdateStatus.cancelled)} className="text-red-600">
                            <XCircle className="w-4 h-4 mr-2" /> ยกเลิกออเดอร์
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedOrder && !!newStatus} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl text-sm">
              <div><span className="text-gray-500">ออเดอร์:</span> <span className="font-bold">#{selectedOrder?.id.toString().padStart(4, '0')}</span></div>
              <div><span className="text-gray-500">ลูกค้า:</span> <span className="font-bold">{selectedOrder?.user?.username}</span></div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-gray-500">สถานะใหม่:</span> 
                {newStatus && getStatusBadge(newStatus as any)}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">ข้อความถึงลูกค้า (ไม่บังคับ)</label>
              <Textarea 
                placeholder="เช่น กำลังเริ่มทำให้นะคะ, ส่งงานทาง Discord แล้วนะคะ"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="rounded-xl bg-white resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="rounded-xl">ยกเลิก</Button>
            <Button onClick={handleUpdateStatus} disabled={updateStatus.isPending} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
              {updateStatus.isPending ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
