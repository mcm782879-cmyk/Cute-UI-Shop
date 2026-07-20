import { useState, useEffect } from "react";
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

// Discord SVG logo
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
    </svg>
  );
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();

  // Show error from Discord OAuth redirect (e.g. ?error=discord_denied)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "discord_denied") toast.error("คุณยกเลิกการเข้าสู่ระบบด้วย Discord");
    else if (err) toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Discord กรุณาลองใหม่อีกครั้ง");
    if (err) window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res.token);
        toast.success("เข้าสู่ระบบสำเร็จ!");
        setTimeout(() => {
          if (res.user.role === "admin") {
            setLocation("/admin");
          } else {
            const urlParams = new URLSearchParams(window.location.search);
            setLocation(urlParams.get("redirect") || "/my-orders");
          }
        }, 100);
      },
      onError: (err) => {
        toast.error(err.message || "Username หรือรหัสผ่านไม่ถูกต้อง");
      },
    });
  };

  const handleDiscordLogin = () => {
    window.location.href = "/api/auth/discord";
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-20 relative overflow-hidden bg-gray-50/50">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 translate-y-1/2" />

      <Card className="w-full max-w-md rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="p-8 text-center bg-gradient-to-b from-primary/5 to-transparent">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ยินดีต้อนรับกลับมา!</h1>
          <p className="text-gray-500 text-sm">เข้าสู่ระบบเพื่อดูสถานะงานของคุณ</p>
        </div>

        <CardContent className="p-8 pt-0 space-y-6">
          {/* Discord OAuth button */}
          <Button
            type="button"
            onClick={handleDiscordLogin}
            className="w-full h-12 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-3"
            style={{ background: "#5865F2" }}
          >
            <DiscordIcon className="w-5 h-5" />
            เข้าสู่ระบบด้วย Discord
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">หรือเข้าสู่ระบบด้วย Username</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Username / Password form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-gray-700">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="กรอก Username ของคุณ"
                        className="h-12 rounded-xl bg-gray-50 border-transparent focus-visible:ring-primary focus-visible:bg-white"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 rounded-xl bg-gray-50 border-transparent focus-visible:ring-primary focus-visible:bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-md"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-gray-500">
            ยังไม่มีบัญชีใช่ไหม?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              สมัครสมาชิกที่นี่
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
