import React from 'react';
import { Book } from '@workspace/api-client-react';
import { useCart } from '@/hooks/use-cart';
import { Link } from 'wouter';
import { ShoppingCart, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BookCardProps {
  book: Book;
  index?: number;
}

export function BookCard({ book, index = 0 }: BookCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (book.stock > 0) {
      addItem(book);
      toast({
        title: "تم الإضافة إلى السلة",
        description: `تمت إضافة "${book.titleAr}" بنجاح`,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/books/${book.id}`}>
        <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1 flex flex-col h-full cursor-pointer">
          
          {/* Discount Badge */}
          {book.isOnSale && book.originalPrice && (
            <div className="absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground px-3 py-1 text-sm font-bold rounded-full shadow-lg">
              عرض
            </div>
          )}

          {/* Out of Stock Badge */}
          {book.stock === 0 && (
            <div className="absolute top-3 left-3 z-10 bg-muted/80 text-muted-foreground backdrop-blur-sm px-3 py-1 text-sm font-bold rounded-full shadow-lg">
              نفد المخزون
            </div>
          )}

          {/* Cover Image Container */}
          <div className="relative aspect-[2/3] overflow-hidden bg-muted/30">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.titleAr}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
                <span className="text-4xl">🕯️</span>
                <span className="mt-2 font-serif">{book.titleAr}</span>
              </div>
            )}
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {book.titleAr}
            </h3>
            <p className="text-muted-foreground text-sm mb-3">
              {book.authorAr}
            </p>
            
            <div className="mt-auto pt-4 flex items-end justify-between">
              <div className="flex flex-col">
                {book.isOnSale && book.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through decoration-destructive/70 decoration-2">
                    {book.originalPrice} ج.م
                  </span>
                )}
                <span className="text-primary font-bold text-xl drop-shadow-sm">
                  {book.price} ج.م
                </span>
              </div>
              
              <Button 
                onClick={handleAddToCart}
                disabled={book.stock === 0}
                size="icon"
                className="rounded-full w-10 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(200,162,74,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}