import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { BookCard } from '@/components/BookCard';
import { useListBooks, useListCategories } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';

export default function Books() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Sync state with URL when initial loads
  useEffect(() => {
    const s = searchParams.get('search');
    if (s) setSearch(s);
    const c = searchParams.get('category');
    if (c) setCategory(c);
  }, [location]);

  const { data: categories } = useListCategories();
  
  const queryParams = {
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
    inStock: inStock ? true : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    limit,
    offset: (page - 1) * limit,
  };

  const { data, isLoading } = useListBooks(queryParams);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">جميع الروايات</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-64 shrink-0 space-y-8">
            <div className="bg-card p-6 rounded-2xl border border-border/50 space-y-6">
              <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                <SlidersHorizontal className="w-5 h-5" />
                تصفية النتائج
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label>البحث</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="اسم الرواية أو المؤلف..."
                    className="pr-9"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>السعر</Label>
                  <span className="text-xs text-muted-foreground">{priceRange[0]} - {priceRange[1]} ج.م</span>
                </div>
                <Slider
                  defaultValue={[0, 1000]}
                  max={2000}
                  step={50}
                  value={priceRange}
                  onValueChange={setPriceRange}
                />
              </div>

              {/* In Stock Only */}
              <div className="flex items-center justify-between">
                <Label htmlFor="in-stock">متوفر في المخزون فقط</Label>
                <Switch 
                  id="in-stock" 
                  checked={inStock}
                  onCheckedChange={setInStock}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : data?.books.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
                <span className="text-4xl mb-4 block opacity-50">🕯️</span>
                <h3 className="text-xl font-bold mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground">جرب تغيير خيارات البحث والتصفية</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {data?.books.map((book, i) => (
                    <BookCard key={book.id} book={book} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {data && data.total > limit && (
                  <div className="mt-12 flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      السابق
                    </Button>
                    <div className="flex items-center px-4 font-medium">
                      {page} / {Math.ceil(data.total / limit)}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(data.total / limit)}
                    >
                      التالي
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}