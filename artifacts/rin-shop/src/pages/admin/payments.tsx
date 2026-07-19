import { useEffect, useState, useMemo } from "react";
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
  CheckCircle2, XCircle, Clock, Eye, CreditCard,
  TrendingUp, AlertCircle, Filter, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type FilterTab = "all" | "pending" | "verified" | "rejected";

export default function AdminPayments() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: payments, isLoading, refetch } = useListPayments({
    query: { enabled: user?.role === "admin", queryKey: getListPaymentsQueryKey() }
  });
  const verifyPayment = useVerifyPayment();

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionType, setActionType] = useState<"verify" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) setLocation("/");
  }, [user, authLoading, setLocation]);

  const stats = useMemo(() => {
    if (!payments) return { total: 0, pending: 0, verified: 0, rejected: 0, totalVerifiedAmount: 0 };
    return {
      total: payments.length,
      pending: payments.filter(p => p.status === PaymentStatus.pending).length,
      verified: payments.filter(p => p.status === PaymentStatus.verified).length,
      rejected: payments.filter(p => p.status === PaymentStatus.rejected).length,
      totalVerifiedAmount: payments
        .filter(p => p.status === PaymentStatus.verified && p.amount)
        .reduce((sum, p) => sum + (p.amount ?? 0), 0),
    };
  }, [payments]);

  const filtered = useMemo(() => {
    if (!payments) return [];
    if (activeTab === "all") return payments;
    return payments.filter(p => p.status === activeTab);
  }, [payments, activeTab]);

  const handleAction = () => {
    if (!selectedPayment || !actionType) return;
    verifyPayment.mutate({
      id: selectedPayment.id,
      data: {
        status: actionType === "verify" ? PaymentVerifyInputStatus.verified : PaymentVerifyInputStatus.rejected,
        note: note || undefined,
      }
    }, {
      onSuccess: () => {
        toast.success(actionType === "verify" ? "ยืนยันการชำระเงินสำเร็จ ✅" : "ปฏิเสธสลิปสำเร็จ");
        setSelectedPayment(null); setActionType(null); setNote(""); refetch();
      },
      onError: (err) => toast.error(err.message || "เกิดข้อผิดพลาด"),
    });
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.pending: return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-xs"><Clock className="w-3 h-3 mr-1" />รอตรวจ</Badge>;
      case PaymentStatus.verified: return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />ผ่านแล้ว</Badge>;
      case PaymentStatus.rejected: return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs"><XCircle className="w-3 h-3 mr-1" />ไม่ผ่าน</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: stats.total },
    { key: "pending", label: "รอตรวจ", count: stats.pending },
    { key: "verified", label: "ผ่านแล้ว", count: stats.verified },
    { key: "rejected", label: "ไม่ผ่าน", count: stats.rejected },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-56 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">ประวัติการโอนเงิน</h1>
        <p className="text-gray-500 text-sm mt-1">ตรวจสอบและยืนยันสลิปการโอนเงินของลูกค้าทั้งหมด</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500 font-medium">รายการทั้งหมด</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-3">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-gray-800">{stats.pending}</div>
            <div className="text-xs text-gray-500 font-medium">รอตรวจสอบ</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-gray-800">{stats.verified}</div>
            <div className="text-xs text-gray-500 font-medium">ยืนยันแล้ว</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardContent className="p-5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-3">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-gray-800">฿{stats.totalVerifiedAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium">ยอดรับรวม</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        <Filter className="w-4 h-4 text-gray-400 ml-2" />
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Payment List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">ไม่มีรายการ{activeTab !== "all" ? "ในหมวดนี้" : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(payment => (
            <div
              key={payment.id}
              className="bg-white rounded-[1.5rem] shadow-sm border border-gray-50 flex items-stretch overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Slip thumbnail */}
              <button
                className="w-24 md:w-32 flex-shrink-0 bg-gray-100 relative group"
                onClick={() => { setSelectedPayment(payment); setActionType(null); }}
              >
                <img src={payment.slipImageBase64} alt="slip" className="w-full h-full object-cover" style={{ minHeight: 96 }} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </button>

              {/* Content */}
              <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-gray-400">ออเดอร์ #{payment.orderId.toString().padStart(4, "0")}</span>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-black text-gray-900">
                      {payment.amount != null ? `฿${payment.amount.toLocaleString()}` : "ไม่ได้ระบุยอด"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {payment.username && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />{payment.username}
                      </span>
                    )}
                    <span>{format(new Date(payment.createdAt), "dd MMM yy · HH:mm", { locale: th })}</span>
                  </div>
                  {payment.note && (
                    <div className="mt-2 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 inline-block">
                      {payment.note}
                    </div>
                  )}
                  {payment.verifiedAt && payment.status === PaymentStatus.verified && (
                    <div className="mt-1 text-xs text-green-600">
                      ✅ ยืนยันเมื่อ {format(new Date(payment.verifiedAt), "dd MMM yy HH:mm", { locale: th })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {payment.status === PaymentStatus.pending && (
                  <div className="flex gap-2 md:flex-col md:w-32 flex-shrink-0">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl text-red-500 border-red-100 hover:bg-red-50 h-9 text-xs"
                      onClick={() => { setSelectedPayment(payment); setActionType("reject"); }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />ปฏิเสธ
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white h-9 text-xs"
                      onClick={() => { setSelectedPayment(payment); setActionType("verify"); }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />ถูกต้อง
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slip Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-0">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <DialogTitle className="font-bold">
              {actionType === "verify" ? "ยืนยันยอดโอน" : actionType === "reject" ? "ปฏิเสธสลิป" : "สลิปโอนเงิน"}
            </DialogTitle>
            {selectedPayment?.username && (
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <User className="w-3 h-3" />{selectedPayment.username}
                {selectedPayment?.amount ? ` · ฿${selectedPayment.amount.toLocaleString()}` : ""}
              </p>
            )}
          </div>
          <div className="bg-gray-900 flex items-center justify-center max-h-[55vh] overflow-y-auto p-4">
            <img src={selectedPayment?.slipImageBase64} alt="slip" className="max-w-full object-contain rounded-xl" />
          </div>
          {actionType ? (
            <div className="p-6 bg-white border-t border-gray-100">
              <label className="text-sm font-bold text-gray-700 block mb-2">
                {actionType === "verify" ? "ข้อความถึงลูกค้า (ไม่บังคับ)" : "เหตุผลที่ปฏิเสธ (บังคับ)"}
              </label>
              <Textarea
                placeholder={actionType === "verify" ? "เช่น ได้รับยอดแล้วค่ะ" : "เช่น สลิปยอดไม่ตรง, สลิปซ้ำ..."}
                value={note} onChange={(e) => setNote(e.target.value)}
                className="rounded-xl resize-none mb-4"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setActionType(null)} className="flex-1 rounded-xl">ยกเลิก</Button>
                <Button
                  onClick={handleAction}
                  disabled={verifyPayment.isPending || (actionType === "reject" && !note)}
                  className={`flex-1 rounded-xl text-white ${actionType === "verify" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                >
                  {verifyPayment.isPending ? "กำลังบันทึก..." : "ยืนยัน"}
                </Button>
              </div>
            </div>
          ) : (
            selectedPayment?.status === PaymentStatus.pending && (
              <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl text-red-500 border-red-100"
                  onClick={() => setActionType("reject")}>
                  <XCircle className="w-4 h-4 mr-1" />ปฏิเสธ
                </Button>
                <Button className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => setActionType("verify")}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />ยืนยัน
                </Button>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
