import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  useGetSiteSettings,
  getGetSiteSettingsQueryKey,
  useUpdateSiteSettings,
  SiteSettings,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Megaphone, Layout, ShieldCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function AdminSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSiteSettings({
    query: { queryKey: getGetSiteSettingsQueryKey() }
  });
  const updateSettings = useUpdateSiteSettings();
  const [form, setForm] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) setLocation("/");
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (settings && !form) setForm({ ...settings });
  }, [settings, form]);

  const set = (key: keyof SiteSettings, value: string | null) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = () => {
    if (!form) return;
    updateSettings.mutate({ data: form }, {
      onSuccess: (data) => {
        toast.success("บันทึกการตั้งค่าสำเร็จ ✅");
        queryClient.setQueryData(getGetSiteSettingsQueryKey(), data);
      },
      onError: () => toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่"),
    });
  };

  if (authLoading || isLoading || !form) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-8" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl mb-4" />)}
      </div>
    );
  }

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <Card className="rounded-2xl border-0 shadow-sm bg-white mb-5">
      <CardHeader className="pb-2 pt-5 px-6">
        <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="w-4 h-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">{children}</CardContent>
    </Card>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <Label className="text-sm font-semibold text-gray-600 mb-1.5 block">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าเนื้อหาเว็บ</h1>
          <p className="text-gray-500 text-sm mt-1">แก้ไขข้อความและเนื้อหาที่แสดงบนหน้าเว็บได้เลย</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 shadow-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateSettings.isPending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>

      {/* Announcement */}
      <Section icon={Megaphone} title="ประกาศ / แบนเนอร์ (ด้านบนสุดของเว็บ)">
        <Field label="ข้อความประกาศ (เว้นว่างเพื่อซ่อน)">
          <Input
            placeholder="เช่น 🎉 ลด 20% สำหรับลูกค้าใหม่ทุกคน!"
            value={form.announcement ?? ""}
            onChange={(e) => set("announcement", e.target.value || null)}
            className="rounded-xl"
          />
        </Field>
      </Section>

      {/* Hero Section */}
      <Section icon={Layout} title="หน้าแรก — ส่วน Hero">
        <Field label="หัวข้อหลัก">
          <Input
            value={form.heroTitle}
            onChange={(e) => set("heroTitle", e.target.value)}
            className="rounded-xl"
          />
        </Field>
        <Field label="คำอธิบายใต้หัวข้อ">
          <Textarea
            value={form.heroSubtitle}
            onChange={(e) => set("heroSubtitle", e.target.value)}
            className="rounded-xl resize-none"
            rows={3}
          />
        </Field>
      </Section>

      {/* Trust Items */}
      <Section icon={ShieldCheck} title="จุดเด่น 3 ข้อ">
        {([1, 2, 3] as const).map(n => (
          <div key={n} className="p-4 bg-gray-50 rounded-xl space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">ข้อที่ {n}</p>
            <Field label="หัวข้อ">
              <Input
                value={form[`trustItem${n}Title` as keyof SiteSettings] as string}
                onChange={(e) => set(`trustItem${n}Title` as keyof SiteSettings, e.target.value)}
                className="rounded-xl bg-white"
              />
            </Field>
            <Field label="คำอธิบาย">
              <Input
                value={form[`trustItem${n}Desc` as keyof SiteSettings] as string}
                onChange={(e) => set(`trustItem${n}Desc` as keyof SiteSettings, e.target.value)}
                className="rounded-xl bg-white"
              />
            </Field>
          </div>
        ))}
      </Section>

      {/* Contact & Footer */}
      <Section icon={Phone} title="ข้อมูลติดต่อ & Footer">
        <Field label="LINE ID">
          <Input
            placeholder="เช่น @rinjadhai"
            value={form.contactLine ?? ""}
            onChange={(e) => set("contactLine", e.target.value || null)}
            className="rounded-xl"
          />
        </Field>
        <Field label="Discord (username หรือ invite link)">
          <Input
            placeholder="เช่น rin#1234 หรือ discord.gg/xxx"
            value={form.contactDiscord ?? ""}
            onChange={(e) => set("contactDiscord", e.target.value || null)}
            className="rounded-xl"
          />
        </Field>
        <Field label="Facebook (ชื่อเพจหรือ URL)">
          <Input
            placeholder="เช่น facebook.com/rinjadhai"
            value={form.contactFacebook ?? ""}
            onChange={(e) => set("contactFacebook", e.target.value || null)}
            className="rounded-xl"
          />
        </Field>
        <Field label="คำอธิบาย Footer">
          <Textarea
            value={form.footerDescription}
            onChange={(e) => set("footerDescription", e.target.value)}
            className="rounded-xl resize-none"
            rows={2}
          />
        </Field>
      </Section>

      <div className="flex justify-end mt-2">
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 shadow-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateSettings.isPending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </Button>
      </div>
    </div>
  );
}
