import { useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetService,
  getGetServiceQueryKey,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  Package
} from "@workspace/api-client-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { 
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "ชื่อแพ็กเกจต้องมีอย่างน้อย 2 ตัวอักษร"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "ราคาต้องเป็นตัวเลข 0 ขึ้นไป"),
  durationDays: z.coerce.number().min(1, "ระยะเวลาต้องอย่างน้อย 1 วัน"),
  features: z.array(z.object({ value: z.string().min(1, "กรุณากรอกฟีเจอร์") })).min(1, "ต้องมีอย่างน้อย 1 ฟีเจอร์"),
  isPopular: z.boolean().default(false),
});

export default function AdminPackages() {
  const [, params] = useRoute("/admin/packages/:serviceId");
  const serviceId = params?.serviceId ? parseInt(params.serviceId, 10) : 0;

  const { data: service, isLoading: serviceLoading, refetch } = useGetService(serviceId, {
    query: { 
      enabled: !!serviceId,
      queryKey: getGetServiceQueryKey(serviceId)
    }
  });
  
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      durationDays: 1,
      features: [{ value: "" }],
      isPopular: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features"
  });

  const openCreateDialog = () => {
    setEditingPackage(null);
    form.reset({
      name: "",
      description: "",
      price: 0,
      durationDays: 1,
      features: [{ value: "" }],
      isPopular: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    form.reset({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price,
      durationDays: pkg.durationDays,
      features: pkg.features.map(f => ({ value: f })),
      isPopular: pkg.isPopular,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแพ็กเกจนี้?")) {
      deletePackage.mutate({ id }, {
        onSuccess: () => {
          toast.success("ลบแพ็กเกจสำเร็จ");
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "ไม่สามารถลบได้");
        }
      });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      features: values.features.map(f => f.value)
    };

    if (editingPackage) {
      updatePackage.mutate({
        id: editingPackage.id,
        data: payload
      }, {
        onSuccess: () => {
          toast.success("อัพเดทแพ็กเกจสำเร็จ");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "เกิดข้อผิดพลาดในการอัพเดท");
        }
      });
    } else {
      createPackage.mutate({
        serviceId: serviceId,
        data: payload
      }, {
        onSuccess: () => {
          toast.success("สร้างแพ็กเกจใหม่สำเร็จ");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "เกิดข้อผิดพลาดในการสร้าง");
        }
      });
    }
  };

  if (serviceLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] rounded-3xl" />)}
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบบริการนี้</h2>
        <Link href="/admin/services">
          <Button variant="outline">กลับไปหน้าบริการ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href="/admin/services" className="inline-flex items-center text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปจัดการบริการ
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-purple-50">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">จัดการแพ็กเกจ: {service.name}</h1>
          <p className="text-gray-500 text-sm">เพิ่มและแก้ไขแพ็กเกจราคาสำหรับบริการนี้</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm shrink-0">
          <Plus className="w-4 h-4 mr-2" /> เพิ่มแพ็กเกจใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {service.packages.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">ยังไม่มีแพ็กเกจในบริการนี้</p>
            <Button onClick={openCreateDialog} variant="outline" className="rounded-xl">เพิ่มแพ็กเกจแรกเลย!</Button>
          </div>
        ) : (
          service.packages.map((pkg) => (
            <Card key={pkg.id} className={`relative flex flex-col rounded-[2rem] border-2 transition-all ${
              pkg.isPopular ? 'border-primary shadow-md' : 'border-transparent shadow-sm bg-white'
            }`}>
              {pkg.isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <div className="bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                    แนะนำ (Popular)
                  </div>
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex gap-1 z-10">
                <Button variant="secondary" size="icon" onClick={() => openEditDialog(pkg)} className="w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white text-gray-600">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="secondary" size="icon" onClick={() => handleDelete(pkg.id)} className="w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-red-50 text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              
              <CardHeader className="p-8 pb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">฿{pkg.price.toLocaleString()}</span>
                </div>
                <div className="text-sm font-medium text-primary mt-4 bg-primary/10 inline-block px-3 py-1 rounded-full w-fit">
                  เวลาทำ {pkg.durationDays} วัน
                </div>
              </CardHeader>
              
              <CardContent className="p-8 pt-4 flex-1">
                <div className="space-y-3 mt-2">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg rounded-[2rem] p-0 overflow-hidden border-0 max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold">{editingPackage ? "แก้ไขแพ็กเกจ" : "เพิ่มแพ็กเกจใหม่"}</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto flex-1">
            <Form {...form}>
              <form id="package-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-bold">ชื่อแพ็กเกจ</FormLabel>
                        <FormControl>
                          <Input placeholder="เช่น Basic, Pro, VIP" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">ราคา (บาท)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">เวลาทำ (วัน)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">คำอธิบายเพิ่มเติม (ไม่บังคับ)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="เหมาะสำหรับ..." className="rounded-xl resize-none h-16" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel className="font-bold">รายการฟีเจอร์ (จุดเด่นที่ได้)</FormLabel>
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`features.${index}.value`}
                      render={({ field: inputField }) => (
                        <FormItem className="flex items-start gap-2 space-y-0">
                          <FormControl>
                            <Input placeholder="เช่น ตั้งค่ายศครบชุด" className="rounded-xl flex-1" {...inputField} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            className="rounded-xl text-gray-400 hover:text-red-500 shrink-0"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </FormItem>
                      )}
                    />
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="rounded-xl text-primary border-primary/20 hover:bg-primary/5 w-full mt-2"
                    onClick={() => append({ value: "" })}
                  >
                    <Plus className="w-4 h-4 mr-2" /> เพิ่มฟีเจอร์
                  </Button>
                  {form.formState.errors.features && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.features.root?.message}</p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-primary/20 p-4 bg-primary/5">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-bold text-gray-800">
                          ตั้งเป็นแพ็กเกจยอดนิยม
                        </FormLabel>
                        <p className="text-xs text-gray-500">
                          แสดงป้าย แนะนำ/ขายดี และขยายการ์ดให้เด่นขึ้น
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          
          <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl flex-1">
              ยกเลิก
            </Button>
            <Button type="submit" form="package-form" disabled={createPackage.isPending || updatePackage.isPending} className="rounded-xl flex-1 bg-primary text-white">
              บันทึกแพ็กเกจ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
