import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { 
  useGetStoreStats, 
  useListOrders, 
  useListBooks, 
  useUpdateOrderStatus,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  getListOrdersQueryKey,
  getListBooksQueryKey,
  getGetStoreStatsQueryKey,
  OrderStatusUpdateStatus,
  BookCategory
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign, Package, ShoppingCart, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Checkbox } from '@/components/ui/checkbox';

const bookSchema = z.object({
  title: z.string().min(1, 'مطلوب'),
  titleAr: z.string().min(1, 'مطلوب'),
  author: z.string().min(1, 'مطلوب'),
  authorAr: z.string().min(1, 'مطلوب'),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  coverImage: z.string().optional(),
  price: z.coerce.number().min(0),
  originalPrice: z.coerce.number().optional().nullable(),
  category: z.nativeEnum(BookCategory),
  stock: z.coerce.number().min(0),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
});

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: loadingStats } = useGetStoreStats();
  const { data: ordersData, isLoading: loadingOrders } = useListOrders();
  const { data: booksData, isLoading: loadingBooks } = useListBooks({ limit: 100 });

  const updateOrder = useUpdateOrderStatus();
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();

  const handleStatusChange = (orderId: number, status: OrderStatusUpdateStatus) => {
    updateOrder.mutate({ id: orderId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey() });
      }
    });
  };

  const handleDeleteBook = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
      deleteBook.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey() });
        }
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">لوحة الإدارة</h1>
          <p className="text-muted-foreground">نظرة عامة وإدارة المتجر</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '-' : `${stats?.totalRevenue} ج.م`}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
              <ShoppingCart className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '-' : stats?.totalOrders}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">طلبات جديدة</CardTitle>
              <ShoppingCart className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{loadingStats ? '-' : stats?.newOrders}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الكتب</CardTitle>
              <Package className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '-' : stats?.totalBooks}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" dir="rtl">
          <TabsList className="mb-8 bg-muted/50 p-1 border border-border/50 rounded-lg">
            <TabsTrigger value="orders" className="text-base px-8 data-[state=active]:bg-card data-[state=active]:text-primary">الطلبات</TabsTrigger>
            <TabsTrigger value="books" className="text-base px-8 data-[state=active]:bg-card data-[state=active]:text-primary">الكتب</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="bg-card border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingOrders ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : ordersData?.orders.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>
                    ) : (
                      ordersData?.orders.map((order) => (
                        <TableRow key={order.id} className="border-border/20">
                          <TableCell className="font-medium">{order.orderId}</TableCell>
                          <TableCell>
                            <div>{order.customerName}</div>
                            <div className="text-xs text-muted-foreground" dir="ltr">{order.phone}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-bold">{order.totalPrice} ج.م</TableCell>
                          <TableCell>
                            <Select 
                              value={order.status} 
                              onValueChange={(val: OrderStatusUpdateStatus) => handleStatusChange(order.id, val)}
                              disabled={updateOrder.isPending}
                            >
                              <SelectTrigger className="h-8 text-xs bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">جديد</SelectItem>
                                <SelectItem value="confirmed">مؤكد</SelectItem>
                                <SelectItem value="processing">قيد التجهيز</SelectItem>
                                <SelectItem value="shipped">تم الشحن</SelectItem>
                                <SelectItem value="delivered">تم التوصيل</SelectItem>
                                <SelectItem value="cancelled">ملغي</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <a href={`https://wa.me/20${order.phone}?text=مرحباً ${order.customerName} بخصوص طلبك رقم ${order.orderId} من مكتبة ALESLAM...`} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-8 text-xs bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border-[#25D366]/20">
                                واتساب للعميل
                              </Button>
                            </a>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="books">
            <Card className="bg-card border-border/50 overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b border-border/50 bg-muted/20">
                <h3 className="font-bold text-lg">إدارة الكتب</h3>
                <BookDialog mode="create" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-right w-12">الغلاف</TableHead>
                      <TableHead className="text-right">العنوان / المؤلف</TableHead>
                      <TableHead className="text-right">السعر</TableHead>
                      <TableHead className="text-right">التصنيف</TableHead>
                      <TableHead className="text-right">المخزون</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingBooks ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : booksData?.books.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد كتب</TableCell></TableRow>
                    ) : (
                      booksData?.books.map((book) => (
                        <TableRow key={book.id} className="border-border/20">
                          <TableCell>
                            <div className="w-10 h-14 bg-muted rounded overflow-hidden">
                              {book.coverImage && <img src={book.coverImage} className="w-full h-full object-cover" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-sm">{book.titleAr}</div>
                            <div className="text-xs text-muted-foreground">{book.authorAr}</div>
                          </TableCell>
                          <TableCell className="font-medium text-primary text-sm">{book.price} ج.م</TableCell>
                          <TableCell className="text-xs">{book.category}</TableCell>
                          <TableCell>
                            <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${book.stock > 0 ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                              {book.stock}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <BookDialog mode="edit" book={book} />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBook(book.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// --- Dialog Component for Add/Edit Book ---

function BookDialog({ mode, book }: { mode: 'create' | 'edit', book?: any }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: book || {
      title: '', titleAr: '', author: '', authorAr: '', description: '', descriptionAr: '',
      coverImage: '', price: 0, originalPrice: null, category: 'fantasy', stock: 10,
      isFeatured: false, isBestSeller: false, isNewArrival: false, isOnSale: false
    }
  });

  const onSubmit = (data: z.infer<typeof bookSchema>) => {
    if (mode === 'create') {
      createBook.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey() });
          setOpen(false);
          form.reset();
        }
      });
    } else {
      updateBook.mutate({ id: book.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          setOpen(false);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> إضافة كتاب</Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'إضافة كتاب جديد' : 'تعديل بيانات الكتاب'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="titleAr" render={({ field }) => (
                <FormItem><FormLabel>العنوان (عربي)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>العنوان (انجليزي)</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="authorAr" render={({ field }) => (
                <FormItem><FormLabel>المؤلف (عربي)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="author" render={({ field }) => (
                <FormItem><FormLabel>المؤلف (انجليزي)</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>السعر</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="originalPrice" render={({ field }) => (
                <FormItem><FormLabel>السعر قبل الخصم (اختياري)</FormLabel><FormControl><Input type="number" value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>التصنيف</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.values(BookCategory).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="stock" render={({ field }) => (
                <FormItem><FormLabel>المخزون</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="coverImage" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>رابط صورة الغلاف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>الوصف (عربي)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>الوصف (انجليزي)</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl></FormItem>
              )} />
            </div>

            <div className="flex flex-wrap gap-6 p-4 bg-muted/20 rounded-lg border border-border/50">
              <FormField control={form.control} name="isFeatured" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>مختارات (Featured)</FormLabel></FormItem>
              )} />
              <FormField control={form.control} name="isBestSeller" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>الأكثر مبيعاً</FormLabel></FormItem>
              )} />
              <FormField control={form.control} name="isNewArrival" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>وصل حديثاً</FormLabel></FormItem>
              )} />
              <FormField control={form.control} name="isOnSale" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>عرض خاص (Sale)</FormLabel></FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createBook.isPending || updateBook.isPending}>حفظ</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}