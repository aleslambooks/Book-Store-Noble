import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useGetBook, getGetBookQueryKey } from '@workspace/api-client-react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Loader2, Minus, Plus, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function BookDetail() {
  const { id } = useParams();
  const bookId = Number(id);
  const { data: book, isLoading } = useGetBook(bookId, { 
    query: { enabled: !!bookId, queryKey: getGetBookQueryKey(bookId) } 
  });
  
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">الكتاب غير موجود</h1>
            <p className="text-muted-foreground">قد يكون تم حذفه أو أن الرابط غير صحيح.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    if (book.stock >= quantity) {
      addItem(book, quantity);
      toast({
        title: "تم الإضافة إلى السلة",
        description: `تمت إضافة ${quantity} من "${book.titleAr}" بنجاح`,
      });
      setQuantity(1);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative rounded-3xl overflow-hidden aspect-[2/3] max-h-[700px] bg-muted/20 border border-border/50 mx-auto w-full max-w-md shadow-2xl"
          >
            {book.coverImage ? (
              <img 
                src={book.coverImage} 
                alt={book.titleAr}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🕯️</div>
            )}
            {book.isOnSale && (
              <div className="absolute top-6 right-6 bg-destructive text-destructive-foreground px-4 py-1.5 text-sm font-bold rounded-full shadow-lg">
                عرض خاص
              </div>
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl" />
          </motion.div>

          {/* Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col py-4"
          >
            <div className="mb-6 space-y-4">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                {book.category}
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">{book.titleAr}</h1>
              
              <p className="text-xl text-muted-foreground font-medium">بقلم: {book.authorAr}</p>
              
              <div className="flex items-center gap-4 text-sm">
                {book.rating && (
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 mr-2 font-medium">{book.rating}</span>
                    <span className="text-muted-foreground">({book.reviewCount} تقييم)</span>
                  </div>
                )}
                {book.stock > 0 ? (
                  <span className="text-green-500 font-medium">متوفر ({book.stock} نسخ)</span>
                ) : (
                  <span className="text-destructive font-medium">نفد المخزون</span>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold text-primary">{book.price} <span className="text-xl">ج.م</span></span>
                {book.isOnSale && book.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through decoration-destructive mb-1">
                    {book.originalPrice} ج.م
                  </span>
                )}
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-10">
              <h3 className="text-lg font-bold mb-2">عن الرواية</h3>
              <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                {book.descriptionAr || book.description || 'لا يوجد وصف متاح.'}
              </p>
            </div>

            {book.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                <div className="flex items-center bg-card border border-border/50 rounded-full h-14 px-4 w-32 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="flex-1 text-center font-bold text-lg">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => setQuantity(Math.min(book.stock, quantity + 1))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button 
                  size="lg" 
                  className="flex-1 h-14 rounded-full text-lg shadow-[0_0_20px_rgba(200,162,74,0.3)]"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  أضف للسلة
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}