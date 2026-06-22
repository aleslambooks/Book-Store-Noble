import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useTrackOrder, getTrackOrderQueryKey } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, CheckCircle2, Truck, Loader2, FileBox, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STEPS = [
  { id: 'new', label: 'طلب جديد', icon: FileBox },
  { id: 'confirmed', label: 'مؤكد', icon: CheckCircle2 },
  { id: 'processing', label: 'قيد التجهيز', icon: RefreshCcw },
  { id: 'shipped', label: 'تم الشحن', icon: Truck },
  { id: 'delivered', label: 'تم التوصيل', icon: Package },
];

export default function TrackOrder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useState<{orderId?: string, phone?: string} | null>(null);

  const { data: order, isLoading, isError } = useTrackOrder(searchParams || {}, {
    query: {
      enabled: !!searchParams,
      queryKey: getTrackOrderQueryKey(searchParams || {}),
      retry: false
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    if (/^\d{10,}$/.test(searchQuery.trim())) {
      setSearchParams({ phone: searchQuery.trim() });
    } else {
      setSearchParams({ orderId: searchQuery.trim() });
    }
  };

  const currentStepIndex = order ? STATUS_STEPS.findIndex(s => s.id === order.status) : -1;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">تتبع طلبك</h1>
          <p className="text-muted-foreground">أدخل رقم الطلب أو رقم الهاتف المستخدم أثناء الشراء لتتبع حالة طلبك.</p>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border/40 shadow-xl mb-12">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="رقم الطلب أو رقم الهاتف..."
                className="pl-4 pr-12 h-14 text-lg bg-background/50 border-border/50 rounded-full"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 rounded-full shadow-[0_0_15px_rgba(200,162,74,0.3)]">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تتبع الآن'}
            </Button>
          </form>
        </div>

        {isError && (
          <div className="text-center p-8 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
            لم يتم العثور على أي طلب يطابق بيانات البحث. يرجى التأكد والمحاولة مرة أخرى.
          </div>
        )}

        {order && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-6 md:p-10 rounded-3xl border border-border/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary/20" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">طلب #{order.orderId}</h2>
                  <p className="text-muted-foreground">بتاريخ: {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">الإجمالي</div>
                  <div className="text-3xl font-bold text-primary">{order.totalPrice} ج.م</div>
                </div>
              </div>

              {order.status === 'cancelled' ? (
                <div className="text-center p-8 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl font-bold text-xl">
                  تم إلغاء هذا الطلب
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 h-1 bg-muted rounded-full" />
                  
                  <div className="absolute top-1/2 -translate-y-1/2 right-8 h-1 bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%` }} 
                  />

                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const isActive = index <= currentStepIndex;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.id} className="flex flex-col items-center">
                          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 relative z-10 transition-colors duration-500 bg-card
                            ${isActive ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}
                          `}>
                            <StepIcon className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <span className={`mt-3 text-sm md:text-base font-medium text-center max-w-[80px] md:max-w-none
                            ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                          `}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card p-6 rounded-3xl border border-border/40">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-border/50">بيانات التوصيل</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاسم:</span>
                    <span className="font-medium">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الهاتف:</span>
                    <span className="font-medium" dir="ltr">{order.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العنوان:</span>
                    <span className="font-medium text-left max-w-[200px]">{order.governorate}، {order.city}، {order.address}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-3xl border border-border/40">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-border/50">محتويات الطلب</h3>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-12 h-16 rounded bg-muted/20 overflow-hidden shrink-0 border border-border/50">
                        {item.bookCover && <img src={item.bookCover} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 text-sm py-1">
                        <div className="font-bold line-clamp-1">{item.bookTitleAr}</div>
                        <div className="text-muted-foreground mt-1">{item.quantity} × {item.price} ج.م</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}