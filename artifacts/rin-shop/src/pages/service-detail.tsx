import { useGetService, getGetServiceQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, CheckCircle2, Server, MessageSquare, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: service, isLoading, isError } = useGetService(id, {
    query: {
      enabled: !!id,
      queryKey: getGetServiceQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-24 mb-8" />
        <div className="mb-12">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-3xl border-0 shadow-sm h-96">
              <CardContent className="p-8">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-24 mb-8" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบบริการที่ต้องการ</h2>
        <Link href="/">
          <Button variant="outline">กลับหน้าแรก</Button>
        </Link>
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'server': return <Server className="w-12 h-12 text-primary" />;
      case 'discord': return <MessageSquare className="w-12 h-12 text-[#5865F2]" />;
      case 'bot': return <Bot className="w-12 h-12 text-secondary" />;
      default: return <Sparkles className="w-12 h-12 text-primary" />;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-10 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าแรก
      </Link>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-16 bg-white p-8 rounded-[2rem] shadow-sm border border-purple-50">
        <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
          {service.imageUrl ? (
            <img src={service.imageUrl} alt={service.name} className="w-16 h-16 object-contain" />
          ) : (
            getIcon(service.icon)
          )}
        </div>
        <div>
          <Badge variant="secondary" className="mb-3 bg-purple-50 text-primary hover:bg-purple-100">{service.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{service.name}</h1>
          <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">{service.description}</p>
        </div>
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">เลือกแพ็กเกจที่ต้องการ</h2>
        <p className="text-gray-500">ราคาน่ารัก คุ้มค่าทุกแพ็กเกจแน่นอน!</p>
      </div>

      {service.packages.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl">
          <p className="text-gray-500">ยังไม่มีแพ็กเกจสำหรับบริการนี้ในขณะนี้</p>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
        >
          {service.packages.map((pkg) => (
            <motion.div key={pkg.id} variants={item} className="h-full">
              <Card className={`relative h-full flex flex-col rounded-[2rem] border-2 transition-all duration-300 hover:shadow-lg ${
                pkg.isPopular ? 'border-primary shadow-md scale-100 md:scale-105 z-10' : 'border-transparent shadow-sm'
              }`}>
                {pkg.isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <div className="bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                      ขายดีที่สุด 🌟
                    </div>
                  </div>
                )}
                
                <CardHeader className="p-8 pb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900">฿{pkg.price.toLocaleString()}</span>
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-gray-500 mt-4 h-10">{pkg.description}</p>
                  )}
                  <div className="text-sm font-medium text-primary mt-4 bg-primary/10 inline-block px-3 py-1 rounded-full w-fit">
                    ใช้เวลา {pkg.durationDays} วัน
                  </div>
                </CardHeader>
                
                <CardContent className="p-8 pt-4 flex-1">
                  <div className="space-y-4 mt-4">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                <CardFooter className="p-8 pt-0">
                  <Link href={`/order/${pkg.id}?serviceId=${service.id}`} className="w-full">
                    <Button 
                      className={`w-full rounded-xl py-6 font-bold text-md ${
                        pkg.isPopular ? 'bg-primary hover:bg-primary/90 text-white shadow-md' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      เลือกแพ็กเกจนี้
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
