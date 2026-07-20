import { useState } from "react";
import { Link } from "wouter";
import { 
  useListServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  Service
} from "@workspace/api-client-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Plus,
  Pencil,
  Trash2,
  PackageSearch,
  Server,
  MessageSquare,
  Bot,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "ชื่อบริการต้องมีอย่างน้อย 2 ตัวอักษร"),
  description: z.string().min(5, "รายละเอียดสั้นเกินไป"),
  category: z.string().min(2, "กรุณากรอกหมวดหมู่"),
  icon: z.string().min(1, "กรุณาเลือกไอคอน"),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export default function AdminServices() {
  const { data: services, isLoading: servicesLoading, refetch } = useListServices();
  
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      icon: "sparkles",
      imageUrl: "",
      isActive: true,
    },
  });

  const openCreateDialog = () => {
    setEditingService(null);
    form.reset({
      name: "",
      description: "",
      category: "",
      icon: "sparkles",
      imageUrl: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description,
      category: service.category,
      icon: service.icon,
      imageUrl: service.imageUrl || "",
      isActive: service.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบริการนี้? แพ็กเกจทั้งหมดในบริการนี้จะถูกลบไปด้วย")) {
      deleteService.mutate({ id }, {
        onSuccess: () => {
          toast.success("ลบบริการสำเร็จ");
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "ไม่สามารถลบบริการได้");
        }
      });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingService) {
      updateService.mutate({
        id: editingService.id,
        data: values
      }, {
        onSuccess: () => {
          toast.success("อัพเดทบริการสำเร็จ");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "เกิดข้อผิดพลาดในการอัพเดท");
        }
      });
    } else {
      createService.mutate({
        data: values
      }, {
        onSuccess: () => {
          toast.success("สร้างบริการใหม่สำเร็จ");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "เกิดข้อผิดพลาดในการสร้าง");
        }
      });
    }
  };

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'server': return <Server className="w-8 h-8 text-primary" />;
      case 'discord': return <MessageSquare className="w-8 h-8 text-[#5865F2]" />;
      case 'bot': return <Bot className="w-8 h-8 text-secondary" />;
      default: return <Sparkles className="w-8 h-8 text-primary" />;
    }
  };

  if (servicesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการบริการ</h1>
          <p className="text-gray-500">เพิ่ม ลบ หรือแก้ไขบริการหน้าร้าน</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> เพิ่มบริการใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map(service => (
          <Card key={service.id} className={`rounded-3xl border-0 shadow-sm relative overflow-hidden transition-all ${!service.isActive ? 'opacity-70 grayscale-[0.3]' : ''}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.name} className="w-8 h-8 object-contain" />
                  ) : (
                    getIcon(service.icon)
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)} className="text-gray-400 hover:text-primary">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="secondary" className="bg-purple-50 text-primary">{service.category}</Badge>
                {!service.isActive && <Badge variant="outline" className="text-gray-400 border-gray-200">ปิดการแสดงผล</Badge>}
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{service.name}</h3>
              <p className="text-sm text-gray-500 mb-6 line-clamp-2 min-h-[40px]">{service.description}</p>
              
              <Link href={`/admin/packages/${service.id}`} className="w-full">
                <Button variant="outline" className="w-full rounded-xl border-purple-100 text-primary hover:bg-purple-50">
                  <PackageSearch className="w-4 h-4 mr-2" /> จัดการแพ็กเกจ
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingService ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">ชื่อบริการ</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น เปิดเซิฟเวอร์ FiveM" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">หมวดหมู่</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น เกม, Discord, บอท" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">รายละเอียด</FormLabel>
                    <FormControl>
                      <Textarea placeholder="คำอธิบายบริการสั้นๆ..." className="rounded-xl resize-none h-20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">ไอคอน</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="เลือกไอคอน" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sparkles">ทั่วไป (ดาว)</SelectItem>
                        <SelectItem value="server">เซิร์ฟเวอร์</SelectItem>
                        <SelectItem value="discord">Discord</SelectItem>
                        <SelectItem value="bot">บอท</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">URL รูปภาพโลโก้ (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." className="rounded-xl" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-100 p-4 bg-gray-50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-bold text-gray-800">
                        เปิดแสดงผล
                      </FormLabel>
                      <p className="text-sm text-gray-500">
                        แสดงบริการนี้ในหน้าแรก
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

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl flex-1">
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={createService.isPending || updateService.isPending} className="rounded-xl flex-1 bg-primary text-white">
                  บันทึก
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
