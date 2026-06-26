import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useCart } from '@/hooks/use-cart';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateOrder, getListOrdersQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم', 'الغربية',
  'المنوفية', 'المنيا', 'القليوبية', 'الشرقية', 'دمياط', 'كفر الشيخ', 'الإسماعيلية',
  'بورسعيد', 'السويس', 'أسيوط', 'بني سويف', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'مطروح',
  'جنوب سيناء', 'شمال سيناء', 'الوادي الجديد'
];

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'الاسم مطلوب'),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  whatsapp: z.string().optional(),
  governorate: z.string().min(1, 'المحافظة مطلوبة'),
  city: z.string().min(2, 'المدينة مطلوبة'),
  address: z.string().min(5, 'العنوان التفصيلي مطلوب'),
  landmark: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();
  const { toast } = useToast();
  
  const [successOrder, setSuccessOrder] = useState<{ id: string, whatsappUrl: string } | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      whatsapp: '',
      governorate: '',
      city: '',
      address: '',
      landmark: '',
      notes: '',
    }
  });

  if (items.length === 0 && !successOrder) {
    setLocation('/cart');
    return null;
  }

  const onSubmit = async (data: CheckoutFormValues) => {
    const orderData = {
      ...data,
      items: items.map(i => ({
        bookId: i.book.id,
        quantity: i.quantity,
      })),
    };

    createOrder.mutate({ data: orderData }, {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        
        const itemsList = items.map(i => `- ${i.book.titleAr} (${i.quantity})`).join('\n');
        const message = `*طلب جديد من متجر الإسلام* 🕯️
*رقم الطلب:* ${order.orderId}
*الاسم:* ${data.customerName}
*الموبايل:* ${data.phone}
${data.whatsapp ? `*واتساب:* ${data.whatsapp}` : ''}
*العنوان:* ${data.governorate}، ${data.city}، ${data.address}
${data.landmark ? `*علامة مميزة:* ${data.landmark}` : ''}

*الكتب المطلوبة:*
${itemsList}

*الإجمالي:* ${totalPrice} ج.م

${data.notes ? `*ملاحظات:* ${data.notes}` : ''}`;

        const encodedMessage = encodeURIComponent(message);
        const storeOwnerPhone = '201029757694';
        const waUrl = `https://wa.me/${storeOwnerPhone}?text=${encodedMessage}`;
        
        clearCart();
        setSuccessOrder({ id: order.orderId, whatsappUrl: waUrl });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى';
        toast({
          title: 'حدث خطأ',
          description: message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="bg-card p-6 md:p-8 rounded-3xl border border-border/40">
              <h2 className="text-2xl font-bold mb-6">بيانات التوصيل</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم بالكامل *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف *</FormLabel>
                        <FormControl><Input type="tel" dir="ltr" className="text-right" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الواتساب (اختياري)</FormLabel>
                        <FormControl><Input type="tel" dir="ltr" className="text-right" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="governorate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>المحافظة *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GOVERNORATES.map(gov => <SelectItem key={gov} value={gov}>{gov}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة / المنطقة *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="landmark" render={({ field }) => (
                      <FormItem>
                        <FormLabel>علامة مميزة (اختياري)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان التفصيلي (الشارع، رقم العمارة، الشقة) *</FormLabel>
                      <FormControl><Textarea {...field} className="resize-none" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                      <FormControl><Textarea {...field} className="resize-none" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" size="lg" className="w-full rounded-full h-14 text-lg" disabled={createOrder.isPending}>
                    {createOrder.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد الطلب'}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card p-6 rounded-3xl border border-border/40 sticky top-28">
              <h3 className="text-xl font-bold mb-6">ملخص الطلب</h3>
              
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.book.id} className="flex gap-4 items-center">
                    <div className="w-12 h-16 rounded overflow-hidden bg-muted/20 shrink-0">
                      {item.book.coverImage && <img src={item.book.coverImage} alt={item.book.titleAr} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="font-bold line-clamp-1">{item.book.titleAr}</div>
                      <div className="text-muted-foreground">{item.quantity} × {item.book.price} ج.م</div>
                    </div>
                    <div className="font-bold">{item.book.price * item.quantity} ج.م</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 pt-4 flex justify-between items-end mb-2">
                <span className="font-bold">التوصيل</span>
                <span className="text-muted-foreground">يُحدد لاحقاً</span>
              </div>
              <div className="border-t border-border/50 pt-4 flex justify-between items-end">
                <span className="font-bold text-lg">الإجمالي</span>
                <span className="text-3xl font-bold text-primary">{totalPrice} <span className="text-lg">ج.م</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!successOrder} onOpenChange={() => setLocation('/')}>
        <DialogContent className="sm:max-w-md text-center p-8">
          <div className="mx-auto w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">تم استلام طلبك بنجاح!</DialogTitle>
            <DialogDescription className="text-center text-base">
              رقم طلبك هو: <strong className="text-foreground">{successOrder?.id}</strong>
              <br/><br/>
              لضمان سرعة تنفيذ الطلب، يرجى إرسال تفاصيل الطلب عبر الواتساب إلى إدارة المتجر.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-6">
            <a href={successOrder?.whatsappUrl} target="_blank" rel="noreferrer" className="w-full">
              <Button size="lg" className="w-full rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white">
                <MessageCircle className="w-5 h-5 ml-2" /> إرسال عبر واتساب
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
