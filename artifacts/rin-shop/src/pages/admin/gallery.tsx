import { useState } from "react";
import { 
  useListGallery,
  useUploadGalleryImage,
  useDeleteGalleryImage
} from "@workspace/api-client-react";
import { 
  UploadCloud,
  Trash2,
  Image as ImageIcon,
  Loader2,
  XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminGallery() {
  const { data: gallery, isLoading: galleryLoading, refetch } = useListGallery();
  
  const uploadImage = useUploadGalleryImage();
  const deleteImage = useDeleteGalleryImage();

  const [imageBase64, setImageBase64] = useState<string>("");
  const [title, setTitle] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!imageBase64 || !title) return;

    uploadImage.mutate({
      data: {
        imageBase64,
        title
      }
    }, {
      onSuccess: () => {
        toast.success("เพิ่มรูปลงแกลลอรี่สำเร็จ");
        setImageBase64("");
        setTitle("");
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || "เกิดข้อผิดพลาดในการอัพโหลด");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้?")) {
      deleteImage.mutate({ id }, {
        onSuccess: () => {
          toast.success("ลบรูปภาพสำเร็จ");
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "ไม่สามารถลบได้");
        }
      });
    }
  };

  if (galleryLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full mb-8 rounded-[2rem]" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">จัดการรูปภาพผลงาน</h1>
        <p className="text-gray-500">รูปภาพเหล่านี้จะไปแสดงผลแบบสไลด์โชว์ในหน้าแรก</p>
      </div>

      <Card className="rounded-[2rem] border-0 shadow-sm overflow-hidden bg-white mb-10">
        <div className="p-6 bg-purple-50/50 border-b border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">อัพโหลดรูปภาพใหม่</h2>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-1/3">
            {!imageBase64 ? (
              <label className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed border-purple-200 rounded-2xl hover:bg-purple-50 hover:border-primary/50 transition-colors cursor-pointer group bg-gray-50/50">
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-primary mb-3 transition-colors" />
                  <p className="text-sm text-gray-500 font-medium">คลิกเพื่อเลือกไฟล์รูปภาพ</p>
                  <p className="text-xs text-gray-400 mt-1">แนะนำขนาด 800x600 px</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50 flex items-center justify-center">
                <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImageBase64("")} 
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 backdrop-blur-sm"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">คำบรรยายรูปภาพ</label>
              <Input 
                placeholder="เช่น ผลงานตั้งค่าระบบ Discord ชุมชนชาวเกมเมอร์" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
            <Button 
              onClick={handleUpload}
              disabled={!imageBase64 || !title || uploadImage.isPending}
              className="h-12 rounded-xl mt-auto font-bold bg-primary hover:bg-primary/90 text-white"
            >
              {uploadImage.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังอัพโหลด...</>
              ) : "เพิ่มลงแกลลอรี่"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery?.map(img => (
          <div key={img.id} className="group relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-[4/3] bg-gray-50">
            <img src={img.imageBase64} alt={img.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <p className="text-white text-sm font-medium line-clamp-2 mb-3">{img.title}</p>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full rounded-lg"
                onClick={() => handleDelete(img.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" /> ลบรูปภาพ
              </Button>
            </div>
          </div>
        ))}
        {gallery?.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ยังไม่มีรูปภาพในแกลลอรี่</p>
          </div>
        )}
      </div>
    </div>
  );
}
