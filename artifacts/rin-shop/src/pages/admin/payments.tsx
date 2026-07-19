import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  useListPayments,
  getListPaymentsQueryKey,
  useVerifyPayment,
  Payment,
  PaymentStatus,
  PaymentVerifyInputStatus
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { 
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  CreditCard
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPayments() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: payments, isLoading: paymentsLoading, refetch } = useListPayments({
    query: { 
      enabled: user?.role === 'admin',
      queryKey: getListPaymentsQueryKey()
    }
  });
  
  const verifyPayment = useVerifyPayment();

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionType, setActionType] = useState<'verify'|'reject'|null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const handleAction = () => {
    if (!selectedPayment || !actionType) return;

    verifyPayment.mutate({
      id: selectedPayment.id,
      data: {
        status: actionType === 'verify' ? PaymentVerifyInputStatus.verified : PaymentVerifyInputStatus.rejected,
        note: note || undefined
      }
    }, {
      onSuccess: () => {
        toast.success(actionType === 'verify' ? "ยืนยันการชำระเงินสำเร็จ" : "ปฏิเสธสลิปสำเร็จ");
        setSelectedPayment(null);
        setActionType(null);
        setNote("");
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || "เกิดข้อผิดพลาด");
      }
    });
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch(status) {
      case PaymentStatus.pending: return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200"><Clock className="w-3 h-3 mr-1"/> รอตรวจสอบ</Badge>;
      case PaymentStatus.verified: return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1"/> ตรวจสอบแล้ว</Badge>;
      case PaymentStatus.rejected: return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1"/> ไม่ผ่าน/สลิปปลอม</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (authLoading || paymentsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">รายการแจ้งโอนเงิน</h1>
        <p className="text-gray-500">ตรวจสอบสลิปการโอนเงินของลูกค้า</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {payments?.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">ยังไม่มีรายการแจ้งโอนเงิน</p>
          </div>
        ) : (
          payments?.map(payment => (
            <Card key={payment.id} className="rounded-[2rem] border-0 shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="flex h-full">
                <div 
                  className="w-32 bg-gray-100 relative cursor-pointer group"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setActionType(null); // Just view mode
                  }}
                >
                  <img src={payment.slipImageBase64} alt="Slip" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardContent className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-gray-500 font-medium">ออเดอร์ #{payment.orderId.toString().padStart(4, '0')}</div>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="text-lg font-black text-gray-900 mb-1">
                      {payment.amount ? `฿${payment.amount.toLocaleString()}` : 'ไม่ได้ระบุยอด'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(payment.createdAt), "dd MMM yy HH:mm", { locale: th })}
                    </div>
                    {payment.note && (
                      <div className="mt-2 text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-100">
                        <span className="font-bold">หมายเหตุ:</span> {payment.note}
                      </div>
                    )}
                  </div>

                  {payment.status === PaymentStatus.pending && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100 h-9 px-2 text-xs"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setActionType('reject');
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> ปฏิเสธ
                      </Button>
                      <Button 
                        className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white h-9 px-2 text-xs"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setActionType('verify');
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ถูกต้อง
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-0">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
            <DialogTitle className="font-bold">
              {actionType === 'verify' ? "ยืนยันยอดเงิน" : actionType === 'reject' ? "ปฏิเสธสลิป" : "รูปสลิปโอนเงิน"}
            </DialogTitle>
          </div>
          
          <div className="p-4 flex flex-col items-center max-h-[60vh] overflow-y-auto bg-gray-900">
            <img src={selectedPayment?.slipImageBase64} alt="Slip Full" className="max-w-full object-contain rounded-lg" />
          </div>

          {actionType && (
            <div className="p-6 bg-white border-t border-gray-100">
              <div className="mb-4">
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  {actionType === 'verify' ? "ข้อความถึงลูกค้า (ไม่บังคับ)" : "เหตุผลที่ปฏิเสธ (บังคับ)"}
                </label>
                <Textarea 
                  placeholder={actionType === 'verify' ? "เช่น ได้รับยอดแล้วค่ะ" : "เช่น สลิปยอดไม่ตรง, สลิปซ้ำ..."}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setActionType(null)} className="flex-1 rounded-xl">ยกเลิก</Button>
                <Button 
                  onClick={handleAction} 
                  disabled={verifyPayment.isPending || (actionType === 'reject' && !note)}
                  className={`flex-1 rounded-xl text-white ${actionType === 'verify' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {verifyPayment.isPending ? "กำลังบันทึก..." : "ยืนยัน"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
