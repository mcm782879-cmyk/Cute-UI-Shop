import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetService, getGetServiceQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, CreditCard, UploadCloud, CheckCircle, Info } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  discordUsername: z.string().min(2, "กรุณากรอก Discord Username ให้ถูกต้อง"),
  note: z.string().optional(),
});

export default function OrderPage() {
  const [, params] = useRoute("/order/:packageId");
  const packageId = params?.packageId ? parseInt(params.packageId, 10) : 0;
  
  // Extract serviceId from query params
  const searchParams = new URLSearchParams(window.location.search);
  const serviceIdParam = searchParams.get("serviceId");
  const serviceId = serviceIdParam ? parseInt(serviceIdParam, 10) : 0;

  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: service, isLoading: serviceLoading } = useGetService(serviceId, {
    query: {
      enabled: !!serviceId,
      queryKey: getGetServiceQueryKey(serviceId)
    }
  });
  
  const createOrder = useCreateOrder();
  
  const pkg = service?.packages.find(p => p.id === packageId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      discordUsername: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ");
      setLocation(`/login?redirect=/order/${packageId}`);
    }
  }, [user, authLoading, setLocation, packageId]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!pkg) return;
    
    createOrder.mutate({
      data: {
        packageId: pkg.id,
        discordUsername: values.discordUsername,
        note: values.note,
      }
    }, {
      onSuccess: (order) => {
        toast.success("สร้างออเดอร์สำเร็จ!");
        setLocation(`/my-orders?pay=${order.id}`);
      },
      onError: (err) => {
        toast.error(err.message || "เกิดข้อผิดพลาดในการสร้างออเดอร์");
      }
    });
  };

  if (serviceLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <Card className="rounded-[2rem] border-0 shadow-sm mb-8">
          <CardContent className="p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-32 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pkg || !service) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบแพ็กเกจที่ต้องการ</h2>
        <Link href="/">
          <Button variant="outline">กลับหน้าแรก</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href={`/services/${service.id}`} className="inline-flex items-center text-gray-500 hover:text-primary mb-8 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้าบริการ
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2rem] border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-purple-50">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">รายละเอียดการสั่งซื้อ</h2>
              <p className="text-gray-600 text-sm">กรุณากรอกข้อมูลเพื่อให้รินติดต่อกลับและเริ่มงานได้เลยค่ะ</p>
            </div>
            
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="discordUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-gray-700">Discord Username</FormLabel>
                        <FormDescription>
                          เช่น rinjad#1234 หรือ rinjad (รินจะแอดไปเพื่อคุยรายละเอียดงานค่ะ)
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="กรอก Discord Username ของคุณ" className="h-12 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-primary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-gray-700">รายละเอียดเพิ่มเติม (ถ้ามี)</FormLabel>
                        <FormDescription>
                          เช่น โทนสีที่อยากได้, แนวเกมที่ทำ, สิ่งที่เน้นเป็นพิเศษ
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            placeholder="พิมพ์รายละเอียดที่อยากบอกรินได้เลยค่ะ..." 
                            className="min-h-[120px] rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-primary resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full rounded-xl h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-md"
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? "กำลังสร้างออเดอร์..." : "ยืนยันการสั่งซื้อ"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-[2rem] border-2 border-primary/20 shadow-sm sticky top-24">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-500 text-sm mb-4">สรุปรายการสั่งซื้อ</h3>
              
              <div className="flex items-start gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{service.name}</div>
                  <div className="font-bold text-gray-800 leading-tight">{pkg.name}</div>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 py-4 mb-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ระยะเวลาดำเนินการ</span>
                  <span className="font-medium">{pkg.durationDays} วัน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ราคา</span>
                  <span className="font-medium">฿{pkg.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-800">ยอดรวมทั้งสิ้น</span>
                  <span className="text-3xl font-black text-primary">฿{pkg.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex gap-3 text-blue-700 text-sm">
                <Info className="w-5 h-5 shrink-0" />
                <p>หลังจากกดยืนยันออเดอร์ ระบบจะพาไปหน้าชำระเงินเพื่อสแกน QR Code ค่ะ</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
