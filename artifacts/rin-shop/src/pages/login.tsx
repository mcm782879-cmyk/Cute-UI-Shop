import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(2, "Username ต้องมีอย่างน้อย 2 ตัวอักษร"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res.token);
        toast.success("เข้าสู่ระบบสำเร็จ!");
        // Small delay to let auth state update before redirecting
        setTimeout(() => {
          if (res.user.role === 'admin') {
            setLocation("/admin");
          } else {
            const urlParams = new URLSearchParams(window.location.search);
            setLocation(urlParams.get("redirect") || "/my-orders");
          }
        }, 100);
      },
      onError: (err) => {
        toast.error(err.message || "Username หรือรหัสผ่านไม่ถูกต้อง");
      }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-20 relative overflow-hidden bg-gray-50/50">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 translate-y-1/2"></div>

      <Card className="w-full max-w-md rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="p-8 text-center bg-gradient-to-b from-primary/5 to-transparent">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ยินดีต้อนรับกลับมา!</h1>
          <p className="text-gray-500 text-sm">เข้าสู่ระบบเพื่อดูสถานะงานของคุณ</p>
        </div>
        
        <CardContent className="p-8 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="กรอก Username ของคุณ" className="h-12 rounded-xl bg-gray-50 border-transparent focus-visible:ring-primary focus-visible:bg-white" {...field} />
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
                      <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-gray-50 border-transparent focus-visible:ring-primary focus-visible:bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-md mt-6"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm text-gray-500">
            ยังไม่มีบัญชีใช่ไหม? <Link href="/register" className="text-primary font-bold hover:underline">สมัครสมาชิกที่นี่</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
