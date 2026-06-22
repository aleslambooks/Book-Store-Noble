import React from 'react';
import { Layout } from '@/components/Layout';
import { useCart } from '@/hooks/use-cart';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">سلة المشتريات</h1>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-border/30">
            <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
            <h2 className="text-2xl font-bold mb-2">سلتك فارغة</h2>
            <p className="text-muted-foreground mb-8">لم تقم بإضافة أي روايات إلى سلتك بعد.</p>
            <Link href="/books">
              <Button size="lg" className="rounded-full">تصفح الروايات</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.book.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="flex flex-col sm:flex-row gap-6 p-4 bg-card rounded-2xl border border-border/40 relative group"
                  >
                    <div className="w-24 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-muted/20 border border-border/50">
                      {item.book.coverImage ? (
                        <img src={item.book.coverImage} alt={item.book.titleAr} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🕯️</div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="pr-8">
                        <Link href={`/books/${item.book.id}`}>
                          <h3 className="text-lg font-bold hover:text-primary transition-colors">{item.book.titleAr}</h3>
                        </Link>
                        <p className="text-muted-foreground text-sm mb-2">{item.book.authorAr}</p>
                        <div className="text-primary font-bold">{item.book.price} ج.م</div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center bg-background border border-border/50 rounded-full h-10 px-2 w-28">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="flex-1 text-center font-bold text-sm">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
                            disabled={item.quantity >= item.book.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="font-bold text-lg">
                          {item.book.price * item.quantity} ج.م
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.book.id)}
                      className="absolute top-4 left-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card p-6 rounded-3xl border border-border/40 sticky top-28">
                <h3 className="text-xl font-bold mb-6">ملخص الطلب</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>عدد العناصر</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>التوصيل</span>
                    <span>يحسب في الخطوة التالية</span>
                  </div>
                  <div className="border-t border-border/50 pt-4 flex justify-between items-end">
                    <span className="font-bold text-lg">المجموع الفرعي</span>
                    <span className="text-3xl font-bold text-primary">{totalPrice} <span className="text-lg">ج.م</span></span>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button size="lg" className="w-full rounded-full h-14 text-lg">
                    متابعة الدفع <ArrowLeft className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}