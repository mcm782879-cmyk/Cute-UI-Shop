import { useLocation, Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerMutation.mutate({ 
      data: {
        username: values.username,
        email: values.email,
        password: values.password
      }
    }, {
      onSuccess: (res) => {
        login(res.token);
        toast.success("สมัครสมาชิกสำเร็จ!");
        setTimeout(() => {
          setLocation("/");
        }, 100);
      },
      onError: (err) => {
        toast.error(err.message || "ไม่สามารถสมัครสมาชิกได้");
      }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-20 relative overflow-hidden bg-gray-50/50">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

      <Card className="w-full max-w-md rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="p-8 text-center bg-gradient-to-b from-secondary/5 to-transparent">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
            <UserPlus className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">สร้างบัญชีใหม่</h1>
          <p className="text-gray-500 text-sm">มาเป็นครอบครัวเดียวกับรินจัดให้กันเถอะ!</p>
        </div>
        
        <CardContent className="p-8 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="ตั้งชื่อผู้ใช้ของคุณ" className="h-12 rounded-xl bg-gray-50 border-transparent focus-visible:ring-secondary focus-visible:bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" className="h-12 rounded-xl bg-gray-50 border-transparent focus-visible:ring-secondary focus-visible:bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">รหัสผ่าน</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-gray-50 border-transparent focus-visible:ring-secondary focus-visible:bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">ยืนยันรหัสผ่าน</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-gray-50 border-transparent focus-visible:ring-secondary focus-visible:bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-bold bg-secondary hover:bg-secondary/90 text-white shadow-md mt-8"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "กำลังสร้างบัญชี..." : "สมัครสมาชิกเลย"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm text-gray-500">
            มีบัญชีอยู่แล้ว? <Link href="/login" className="text-secondary font-bold hover:underline">เข้าสู่ระบบ</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
