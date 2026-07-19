import { useListServices, useListGallery } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Server, MessageSquare, Bot, ArrowRight, ShieldCheck, Clock, HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

export default function Home() {
  const { data: services, isLoading: servicesLoading } = useListServices();
  const { data: gallery, isLoading: galleryLoading } = useListGallery();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'server': return <Server className="w-8 h-8 text-primary" />;
      case 'discord': return <MessageSquare className="w-8 h-8 text-[#5865F2]" />;
      case 'bot': return <Bot className="w-8 h-8 text-secondary" />;
      default: return <Sparkles className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-purple-100 shadow-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">ยินดีต้อนรับสู่ รินจัดให้!</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-gray-800 mb-6 max-w-3xl leading-tight"
        >
          อยากได้เซิร์ฟเวอร์แบบไหน <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">รินจัดให้!</span> ได้หมดเลย
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl"
        >
          บริการรับเปิดเซิร์ฟเวอร์เกม ตั้งค่า Discord หรือติดตั้งบอทต่างๆ 
          ดูแลดุจญาติมิตร ราคาน่ารัก เป็นกันเองสุดๆ ✨
        </motion.p>
      </section>

      {/* Stats/Trust Bar */}
      <section className="bg-white py-12 border-y border-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800">เชื่อถือได้ 100%</h3>
              <p className="text-sm text-gray-500">ดูแลระบบด้วยความปลอดภัยสูงสุด ไม่ทิ้งงานแน่นอน</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800">ส่งงานไว</h3>
              <p className="text-sm text-gray-500">ทำมอบหมายรวดเร็ว ตรงต่อเวลา ตามที่ตกลงกันไว้</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800">บริการดุจเพื่อนสนิท</h3>
              <p className="text-sm text-gray-500">สอบถามได้ตลอด ยินดีให้คำปรึกษาด้วยความเต็มใจ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">บริการของเรา</h2>
            <p className="text-gray-500">เลือกบริการที่ใช่สำหรับคุณได้เลย รินพร้อมลุย!</p>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="rounded-3xl border-0 shadow-sm h-72">
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <Skeleton className="w-16 h-16 rounded-2xl" />
                    <div>
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {services?.filter(s => s.isActive).map(service => (
                <motion.div key={service.id} variants={item} className="h-full">
                  <Link href={`/services/${service.id}`} className="block h-full group">
                    <Card className="h-full rounded-[2rem] border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-2 overflow-hidden relative">
                      {/* Hover gradient effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <CardContent className="p-8 h-full flex flex-col relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          {service.imageUrl ? (
                            <img src={service.imageUrl} alt={service.name} className="w-10 h-10 object-contain" />
                          ) : (
                            getIcon(service.icon)
                          )}
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-500 rounded-full mb-3 inline-block">
                            {service.category}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 mb-3">{service.name}</h3>
                        <p className="text-gray-500 text-sm mb-8 flex-1 leading-relaxed">
                          {service.description}
                        </p>
                        
                        <div className="flex items-center text-primary font-semibold text-sm mt-auto group-hover:translate-x-2 transition-transform">
                          ดูแพ็กเกจ <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      {gallery && gallery.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">ผลงานที่ผ่านมา</h2>
              <p className="text-gray-500">ส่วนหนึ่งของความประทับใจจากลูกค้าที่น่ารักของเรา</p>
            </div>

            <Carousel
              plugins={[Autoplay({ delay: 3000 })]}
              opts={{ align: "start", loop: true }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {gallery.map(img => (
                  <CarouselItem key={img.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-purple-50 group relative aspect-[4/3]">
                        <img 
                          src={img.imageBase64} 
                          alt={img.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                          <p className="text-white font-medium">{img.title}</p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>
      )}
    </div>
  );
}
