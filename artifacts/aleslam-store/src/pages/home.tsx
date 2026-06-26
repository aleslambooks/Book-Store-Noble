import React from 'react';
import { Layout } from '@/components/Layout';
import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  useGetFeaturedBooks, 
  useGetBestSellers, 
  useGetNewArrivals,
  useListCategories
} from '@workspace/api-client-react';
import { Sparkles, Flame, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORY_COLORS: Record<string, string> = {
  'horror': 'from-red-950/40 to-background',
  'romance': 'from-rose-950/40 to-background',
  'fantasy': 'from-purple-950/40 to-background',
  'mystery': 'from-blue-950/40 to-background',
  'thriller': 'from-orange-950/40 to-background',
  'sci-fi': 'from-teal-950/40 to-background',
};

const CATEGORY_ICONS: Record<string, string> = {
  'horror': '🦇',
  'romance': '🌹',
  'fantasy': '✨',
  'mystery': '🔍',
  'thriller': '⚡',
  'sci-fi': '🚀',
};

export default function Home() {
  const { data: featured, isLoading: loadingFeatured } = useGetFeaturedBooks();
  const { data: bestSellers, isLoading: loadingBestSellers } = useGetBestSellers();
  const { data: newArrivals, isLoading: loadingNewArrivals } = useGetNewArrivals();
  const { data: categories, isLoading: loadingCategories } = useListCategories();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Hero Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-orange-900/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium">اكتشف عوالم جديدة</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.2] text-foreground">
              مكتبة <span className="text-primary font-serif">ALESLAM</span><br/>
              للروايات الفاخرة 🕯️
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl">
              وجهتك الأولى لأفضل الروايات المترجمة والعربية. انغمس في قصص تأسر الأنفاس بين الرعب، الغموض، الرومانسية، والخيال العلمي.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/books">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(200,162,74,0.3)] hover:shadow-[0_0_30px_rgba(200,162,74,0.5)] transition-all">
                  تصفح المكتبة
                </Button>
              </Link>
              <Link href="/books?featured=true">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border/50 hover:bg-muted/50 backdrop-blur-sm">
                  ترشيحاتنا لك
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-card border-y border-border/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">اكتشف حسب التصنيف</h2>
            <p className="text-muted-foreground">اختر عالمك المفضل وانطلق في رحلتك</p>
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
              {categories?.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/books?category=${cat.id}`}>
                    <div className={`relative overflow-hidden group rounded-2xl p-6 h-40 flex flex-col items-center justify-center text-center border border-border/40 bg-gradient-to-b ${CATEGORY_COLORS[cat.id] || 'from-muted/40 to-background'} hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                      <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        {CATEGORY_ICONS[cat.id] || '📚'}
                      </span>
                      <h3 className="font-bold text-lg mb-1">{cat.nameAr}</h3>
                      <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full backdrop-blur-sm">
                        {cat.bookCount} كتاب
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold tracking-wider">مختاراتنا</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">روايات تستحق القراءة</h2>
            </div>
            <Link href="/books?featured=true">
              <Button variant="ghost" className="hidden md:flex gap-2 text-muted-foreground hover:text-primary">
                عرض الكل <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {featured?.slice(0, 5).map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/books?featured=true">
              <Button variant="outline" className="w-full rounded-full">عرض الكل</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-24 bg-card/50 relative border-y border-border/20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600189261867-30e5ffe7b8da?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 text-orange-500 mb-2">
                <Flame className="w-5 h-5" />
                <span className="font-bold tracking-wider">الأكثر مبيعاً</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">الروايات التي أحبها القراء</h2>
            </div>
          </div>

          {loadingBestSellers ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {bestSellers?.slice(0, 5).map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold tracking-wider">وصل حديثاً</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">أحدث الإصدارات</h2>
            </div>
            <Link href="/books?newArrival=true">
              <Button variant="ghost" className="hidden md:flex gap-2 text-muted-foreground hover:text-primary">
                عرض الكل <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loadingNewArrivals ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {newArrivals?.slice(0, 5).map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/books?newArrival=true">
              <Button variant="outline" className="w-full rounded-full">عرض الكل</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -z-10" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <span className="text-5xl mb-6 block drop-shadow-[0_0_15px_rgba(200,162,74,0.5)]">🕯️</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">هل تبحث عن مغامرتك القادمة؟</h2>
            <p className="text-xl text-muted-foreground mb-10">
              تصفح مجموعتنا الكاملة من الروايات واستمتع بتجربة قراءة لا مثيل لها.
            </p>
            <Link href="/books">
              <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_rgba(200,162,74,0.4)] transition-all hover:scale-105">
                تصفح كل الكتب الآن
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
