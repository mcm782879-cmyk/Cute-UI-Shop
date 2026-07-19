import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  useListMyOrders, 
  getListMyOrdersQueryKey,
  useUploadSlip, 
  Order, 
  OrderStatus 
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import QRCode from "qrcode";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  XCircle,
  AlertCircle,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  MessageSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const PROMPTPAY_NUMBER = "1578736502";
// PromptPay Payload generation format roughly:
// 00020101021129370016A0000006770101110113006157873650205802TH5303764
const PROMPTPAY_PAYLOAD = `00020101021129370016A0000006770101110113006${PROMPTPAY_NUMBER}5802TH5303764`;

export default function MyOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: orders, isLoading: ordersLoading, refetch } = useListMyOrders({
    query: { 
      enabled: !!user,
      queryKey: getListMyOrdersQueryKey()
    }
  });
  
  const [selectedOrderToPay, setSelectedOrderToPay] = useState<Order | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const uploadSlip = useUploadSlip();
  const [slipBase64, setSlipBase64] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    // Check if we need to auto-open payment modal from URL
    const urlParams = new URLSearchParams(window.location.search);
    const payId = urlParams.get("pay");
    if (payId && orders) {
      const order = orders.find(o => o.id === parseInt(payId, 10));
      if (order && order.status === OrderStatus.pending) {
        setSelectedOrderToPay(order);
        
        // Remove param from URL without page reload
        window.history.replaceState({}, document.title, "/my-orders");
      }
    }
  }, [orders]);

  useEffect(() => {
    if (selectedOrderToPay) {
      // Add amount to payload if we wanted specific amount (simple PromptPay doesn't strictly need it if user inputs)
      // but let's just generate the basic QR
      QRCode.toDataURL(PROMPTPAY_PAYLOAD, { margin: 2, scale: 8 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error("QR Gen error", err));
    } else {
      setQrCodeUrl("");
      setSlipBase64("");
    }
  }, [selectedOrderToPay]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSlipBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSlip = () => {
    if (!selectedOrderToPay || !slipBase64) return;

    uploadSlip.mutate({
      data: {
        orderId: selectedOrderToPay.id,
        slipImageBase64: slipBase64,
        amount: selectedOrderToPay.totalPrice || selectedOrderToPay.package?.price
      }
    }, {
      onSuccess: () => {
        toast.success("อัพโหลดสลิปสำเร็จ รอแอดมินตรวจสอบนะคะ");
        setSelectedOrderToPay(null);
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || "เกิดข้อผิดพลาดในการอัพโหลดสลิป");
      }
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.pending:
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200"><AlertCircle className="w-3 h-3 mr-1"/> รอชำระเงิน</Badge>;
      case OrderStatus.paid:
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200"><CreditCard className="w-3 h-3 mr-1"/> ชำระแล้ว (รอตรวจสอบ)</Badge>;
      case OrderStatus.processing:
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200"><Clock className="w-3 h-3 mr-1"/> กำลังดำเนินการ</Badge>;
      case OrderStatus.completed:
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1"/> เสร็จสิ้น</Badge>;
      case OrderStatus.cancelled:
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1"/> ยกเลิก</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (authLoading || ordersLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-[60vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ประวัติการสั่งซื้อ</h1>
          <p className="text-gray-500">ติดตามสถานะงานของคุณได้ที่นี่</p>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-purple-50 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">ยังไม่มีประวัติการสั่งซื้อ</h3>
          <p className="text-gray-500 mb-6">ลองดูบริการของเราแล้วเลือกแพ็กเกจที่ถูกใจได้เลย</p>
          <Button onClick={() => setLocation("/")} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
            ดูบริการทั้งหมด
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="md:flex">
                <div className="bg-gray-50 p-6 md:w-64 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-center">
                  <div className="text-xs text-gray-500 mb-1">รหัสออเดอร์ #{order.id.toString().padStart(4, '0')}</div>
                  <div className="font-bold text-gray-800 mb-3">{format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: th })}</div>
                  <div className="mt-auto">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
                
                <CardContent className="p-6 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="font-bold text-lg text-gray-800">{order.package?.name || 'แพ็กเกจ'}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Discord: {order.discordUsername || '-'}
                    </div>
                    {order.note && (
                      <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg mt-2 inline-block">
                        <span className="font-medium text-gray-600">โน้ต: </span>{order.note}
                      </div>
                    )}
                    {order.adminNote && (
                      <div className="text-sm text-primary bg-primary/5 p-2 rounded-lg mt-2 inline-block border border-primary/10">
                        <span className="font-medium">ตอบกลับจากริน: </span>{order.adminNote}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <div className="text-2xl font-black text-gray-900">
                      ฿{(order.totalPrice || order.package?.price || 0).toLocaleString()}
                    </div>
                    {order.status === OrderStatus.pending && (
                      <Button 
                        onClick={() => setSelectedOrderToPay(order)}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm w-full md:w-auto"
                      >
                        ชำระเงิน / แจ้งโอน
                      </Button>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedOrderToPay} onOpenChange={(open) => !open && setSelectedOrderToPay(null)}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-0">
          <div className="bg-primary/5 p-6 border-b border-primary/10 text-center">
            <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">ชำระเงินออเดอร์ #{selectedOrderToPay?.id.toString().padStart(4, '0')}</DialogTitle>
            <DialogDescription className="text-gray-600">
              สแกน QR Code ด้านล่างเพื่อชำระเงินผ่าน PromptPay
            </DialogDescription>
          </div>
          
          <div className="p-6">
            <div className="flex justify-center mb-6">
              {qrCodeUrl ? (
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <Skeleton className="w-48 h-48 rounded-2xl" />
              )}
            </div>
            
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-1">ยอดชำระ</div>
              <div className="text-3xl font-black text-primary">
                ฿{(selectedOrderToPay?.totalPrice || selectedOrderToPay?.package?.price || 0).toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                พร้อมเพย์: <span className="font-bold">{PROMPTPAY_NUMBER}</span> (รินจัดให้)
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-bold text-gray-700 mb-3 text-sm">อัพโหลดสลิปโอนเงิน</h4>
              
              {!slipBase64 ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-primary mb-2 transition-colors" />
                    <p className="text-sm text-gray-500 font-medium">คลิกเพื่อเลือกไฟล์รูปภาพ</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 mb-4 h-40 bg-gray-50 flex items-center justify-center">
                  <img src={slipBase64} alt="Slip preview" className="max-h-full object-contain" />
                  <button 
                    onClick={() => setSlipBase64("")} 
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <Button 
                onClick={handleUploadSlip}
                disabled={!slipBase64 || uploadSlip.isPending}
                className="w-full h-12 rounded-xl mt-4 font-bold bg-primary hover:bg-primary/90 text-white"
              >
                {uploadSlip.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังอัพโหลด...</>
                ) : "แจ้งโอนเงิน"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
