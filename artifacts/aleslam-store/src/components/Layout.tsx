import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { Search, ShoppingCart, Menu, X, BookOpen, UserCircle, Package, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from 'next-themes';

const CATEGORIES = [
  { slug: 'horror', nameAr: 'رعب' },
  { slug: 'romance', nameAr: 'رومانسية' },
  { slug: 'fantasy', nameAr: 'فانتازيا' },
  { slug: 'mystery', nameAr: 'غموض' },
  { slug: 'thriller', nameAr: 'إثارة' },
  { slug: 'sci-fi', nameAr: 'خيال علمي' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/books?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(200,162,74,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(200,162,74,0.8)] transition-all duration-300">🕯️</span>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-serif text-primary tracking-wide">ALESLAM</span>
              <span className="text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase -mt-1">Book Store</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="w-full relative group">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search className="h-5 w-5" />
              </div>
              <Input
                type="search"
                placeholder="ابحث عن رواية أو مؤلف..."
                className="w-full pr-10 bg-muted/30 border-border/50 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-full h-11 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/books" className="hover:text-primary transition-colors">تصفح الكتب</Link>
              <Link href="/track" className="hover:text-primary transition-colors">تتبع الطلب</Link>
            </div>

            <div className="flex items-center gap-2 border-r border-border/50 pr-4 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground rounded-full border-2 border-background">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l-border/50 bg-background/95 backdrop-blur-xl">
                <SheetTitle className="sr-only">القائمة</SheetTitle>
                <div className="flex flex-col gap-8 mt-8">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="بحث..."
                      className="pr-10 bg-muted/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                  
                  <nav className="flex flex-col gap-4 text-lg">
                    <Link href="/">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <BookOpen className="h-5 w-5 text-primary" /> الرئيسية
                      </div>
                    </Link>
                    <Link href="/books">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Package className="h-5 w-5 text-primary" /> جميع الروايات
                      </div>
                    </Link>
                    <Link href="/track">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Search className="h-5 w-5 text-primary" /> تتبع طلبك
                      </div>
                    </Link>
                  </nav>

                  <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">المظهر</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="rounded-full"
                    >
                      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card mt-20 relative overflow-hidden">
        {/* Decorative footer glow */}
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
            
            {/* Brand */}
            <div className="flex flex-col gap-6">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(200,162,74,0.5)]">🕯️</span>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold font-serif text-primary tracking-wide">ALESLAM</span>
                  <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase -mt-1">Book Store</span>
                </div>
              </Link>
              <p className="text-muted-foreground leading-relaxed text-sm">
                ملاذك الآمن للغوص في عوالم الخيال. نقدم لك بعناية نخبة من الروايات والقصص التي تأخذك في رحلة لا تُنسى مع كل صفحة.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-foreground">روابط سريعة</h3>
              <ul className="flex flex-col gap-4 text-sm text-muted-foreground">
                <li><Link href="/books" className="hover:text-primary transition-colors">تصفح جميع الروايات</Link></li>
                <li><Link href="/books?featured=true" className="hover:text-primary transition-colors">توصياتنا لك</Link></li>
                <li><Link href="/books?onSale=true" className="hover:text-primary transition-colors">عروض حصرية</Link></li>
                <li><Link href="/track" className="hover:text-primary transition-colors">تتبع حالة الطلب</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-foreground">التصنيفات</h3>
              <ul className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                {CATEGORIES.map(c => (
                  <li key={c.slug}>
                    <Link href={`/books?category=${c.slug}`} className="hover:text-primary transition-colors">
                      {c.nameAr}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="mt-16 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground/60">
            <p>© {new Date().getFullYear()} ALESLAM Book Store. جميع الحقوق محفوظة.</p>
            <div className="flex gap-4">
              <Link href="/admin" className="hover:text-primary transition-colors">لوحة الإدارة</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}