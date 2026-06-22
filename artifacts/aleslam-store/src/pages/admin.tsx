import React, { useState, useEffect } from 'react';
import { 
  useGetStoreStats, useListOrders, useListBooks, useListCustomers, 
  useGetInventory, useGetAnalytics, useGetSiteSettings, useListActivityLogs,
  useUpdateOrderStatus, useCreateBook, useUpdateBook, useDeleteBook,
  useUpdateSiteSettings, useUpdateStock,
  getListOrdersQueryKey, getListBooksQueryKey, getGetStoreStatsQueryKey,
  getListCustomersQueryKey, getGetInventoryQueryKey, getGetAnalyticsQueryKey,
  getGetSiteSettingsQueryKey, getListActivityLogsQueryKey,
  OrderStatusUpdateStatus, BookCategory
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LayoutDashboard, ShoppingCart, BookOpen, Users, Package, BarChart3, Settings, Activity, LogOut, Menu, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = "dashboard" | "orders" | "books" | "customers" | "inventory" | "analytics" | "settings" | "logs";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { admin, logout } = useAdminAuth();

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "orders": return <OrdersTab />;
      case "books": return <BooksTab />;
      case "customers": return <CustomersTab />;
      case "inventory": return <InventoryTab />;
      case "analytics": return <AnalyticsTab />;
      case "settings": return <SettingsTab />;
      case "logs": return <LogsTab />;
      default: return null;
    }
  };

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { id: "orders", label: "الطلبات", icon: ShoppingCart },
    { id: "books", label: "الكتب", icon: BookOpen },
    { id: "customers", label: "العملاء", icon: Users },
    { id: "inventory", label: "المخزون", icon: Package },
    { id: "analytics", label: "التحليلات", icon: BarChart3 },
    { id: "settings", label: "الإعدادات", icon: Settings },
    { id: "logs", label: "سجل النشاط", icon: Activity },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-center gap-3">
          <div className="bg-primary/20 p-2 rounded-full border border-primary/30">
            <span className="text-xl">🕯️</span>
          </div>
          <h2 className="font-serif font-bold text-xl text-primary">ALESLAM</h2>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="mb-4 px-2">
          <div className="font-bold truncate">{admin?.name}</div>
          <div className="text-xs text-muted-foreground truncate">{admin?.email}</div>
        </div>
        <Button variant="destructive" className="w-full gap-2" onClick={logout}>
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 border-l border-border/50 flex-col fixed right-0 top-0 h-screen z-40 bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕯️</span>
          <span className="font-serif font-bold text-primary">ALESLAM</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon"><Menu className="w-5 h-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-72 bg-card border-l border-border/50">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:mr-72 min-h-screen p-4 md:p-8 overflow-x-hidden">
        {renderTabContent()}
      </main>
    </div>
  );
}

// --- Tabs Components ---

function DashboardTab() {
  const { data: stats, isLoading: loadingStats } = useGetStoreStats();
  const { data: orders, isLoading: loadingOrders } = useListOrders();
  const { data: inventory, isLoading: loadingInventory } = useGetInventory();

  const recentOrders = orders?.slice(0, 10) || [];
  const lowStock = inventory?.filter(i => i.status !== 'in_stock') || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold mb-1">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على أداء المتجر</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{loadingStats ? '-' : `${stats?.totalRevenue?.toLocaleString()} ج.م`}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{loadingStats ? '-' : stats?.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{loadingStats ? '-' : stats?.newOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الكتب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{loadingStats ? '-' : stats?.totalBooks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">أحدث الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {loadingOrders ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div> : (
              <div className="space-y-4">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <div className="font-medium text-sm">{o.orderId}</div>
                      <div className="text-xs text-muted-foreground">{o.customerName}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">{o.totalPrice} ج.م</div>
                      <Badge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">تنبيهات المخزون</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {loadingInventory ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div> : (
              <div className="space-y-4">
                {lowStock.length === 0 ? <p className="text-muted-foreground text-center py-8">المخزون جيد</p> : lowStock.map(i => (
                  <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="font-medium text-sm line-clamp-1 flex-1">{i.titleAr}</div>
                    <div className="flex items-center gap-2 mr-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${i.status === 'out_of_stock' ? 'bg-destructive/20 text-destructive' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        {i.stock} متبقي
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">المبيعات حسب التصنيف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
             {loadingStats ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div> : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats?.categoryBreakdown || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                   <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                   <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading } = useListOrders();
  const updateOrder = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (orders ?? []).filter(o => 
    (statusFilter === "all" || o.status === statusFilter) && 
    (o.orderId.includes(search) || o.customerName.includes(search) || o.phone.includes(search))
  );

  const handleStatusChange = (id: number, status: OrderStatusUpdateStatus) => {
    updateOrder.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast.success("تم تحديث حالة الطلب");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold mb-1">الطلبات</h1>
        <p className="text-muted-foreground">إدارة وتتبع طلبات العملاء</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input 
          placeholder="بحث برقم الطلب، الاسم، الهاتف..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="new">جديد</SelectItem>
            <SelectItem value="confirmed">مؤكد</SelectItem>
            <SelectItem value="processing">قيد التجهيز</SelectItem>
            <SelectItem value="shipped">تم الشحن</SelectItem>
            <SelectItem value="delivered">تم التوصيل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right whitespace-nowrap">رقم الطلب</TableHead>
                <TableHead className="text-right whitespace-nowrap">العميل</TableHead>
                <TableHead className="text-right whitespace-nowrap">المحافظة</TableHead>
                <TableHead className="text-right whitespace-nowrap">الإجمالي</TableHead>
                <TableHead className="text-right whitespace-nowrap">الحالة</TableHead>
                <TableHead className="text-right whitespace-nowrap">التاريخ</TableHead>
                <TableHead className="text-right whitespace-nowrap">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin text-primary mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>
              ) : filtered.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.orderId}</TableCell>
                  <TableCell>
                    <div>{o.customerName}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{o.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm">{o.governorate}</TableCell>
                  <TableCell className="font-bold">{o.totalPrice} ج.م</TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(val: any) => handleStatusChange(o.id, val)} disabled={updateOrder.isPending}>
                      <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
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
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(new Date(o.createdAt), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <a 
                        href={`https://wa.me/201029757694?text=${encodeURIComponent(`🕯️ طلب جديد - مكتبة ALESLAM\nرقم الطلب: ${o.orderId}\nالعميل: ${o.customerName}\nالهاتف: ${o.phone}\nالعنوان: ${o.governorate} - ${o.city} - ${o.address}\nالكتب: ${o.items?.map(i => i.bookTitleAr + " x" + i.quantity).join("، ")}\nالإجمالي: ${o.totalPrice} ج.م`)}`} 
                        target="_blank" rel="noreferrer"
                      >
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-muted/50 border-primary/20 text-primary">المالك</Button>
                      </a>
                      <a 
                        href={`https://wa.me/${o.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${o.customerName}، بخصوص طلبك رقم ${o.orderId}...`)}`} 
                        target="_blank" rel="noreferrer"
                      >
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20">العميل</Button>
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function BooksTab() {
  const { data: booksData, isLoading } = useListBooks({ limit: 500 });
  const deleteBook = useDeleteBook();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = (booksData?.books ?? []).filter(b => 
    (catFilter === "all" || b.category === catFilter) && 
    (b.titleAr.includes(search) || b.authorAr.includes(search))
  );

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الكتاب؟")) {
      deleteBook.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          toast.success("تم الحذف بنجاح");
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">الكتب</h1>
          <p className="text-muted-foreground">إدارة محتوى المكتبة</p>
        </div>
        <BookDialog mode="create" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input 
          placeholder="بحث بالعنوان، المؤلف..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="horror">رعب</SelectItem>
            <SelectItem value="romance">رومانسية</SelectItem>
            <SelectItem value="fantasy">فانتازيا</SelectItem>
            <SelectItem value="mystery">غموض</SelectItem>
            <SelectItem value="thriller">إثارة</SelectItem>
            <SelectItem value="sci-fi">خيال علمي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-12">الغلاف</TableHead>
                <TableHead className="text-right">العنوان / المؤلف</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">السعر</TableHead>
                <TableHead className="text-right">المخزون</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin text-primary mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد كتب</TableCell></TableRow>
              ) : filtered.map(b => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="w-10 h-14 bg-muted rounded overflow-hidden">
                      {b.coverImage && <img src={b.coverImage} className="w-full h-full object-cover" alt="" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm">{b.titleAr}</div>
                    <div className="text-xs text-muted-foreground">{b.authorAr}</div>
                    <div className="flex gap-1 mt-1">
                      {b.isFeatured && <span className="text-[10px] px-1 bg-primary/20 text-primary rounded">مختارات</span>}
                      {b.isBestSeller && <span className="text-[10px] px-1 bg-blue-500/20 text-blue-500 rounded">الأكثر مبيعاً</span>}
                      {b.isNewArrival && <span className="text-[10px] px-1 bg-green-500/20 text-green-500 rounded">جديد</span>}
                      {b.isOnSale && <span className="text-[10px] px-1 bg-red-500/20 text-red-500 rounded">عرض</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{b.category}</TableCell>
                  <TableCell className="font-medium text-primary text-sm">{b.price} ج.م</TableCell>
                  <TableCell>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${b.stock > 0 ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                      {b.stock}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <BookDialog mode="edit" book={b} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function CustomersTab() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useListCustomers({ search: search || undefined }, { query: { enabled: true, queryKey: getListCustomersQueryKey({ search: search || undefined }) } });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold mb-1">العملاء</h1>
        <p className="text-muted-foreground">إدارة بيانات المشترين</p>
      </div>

      <div className="max-w-md">
        <Input 
          placeholder="بحث بالاسم، الهاتف..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">المحافظة</TableHead>
                <TableHead className="text-right">الطلبات</TableHead>
                <TableHead className="text-right">الإنفاق</TableHead>
                <TableHead className="text-right">التسجيل</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin text-primary mx-auto" /></TableCell></TableRow>
              ) : !customers || customers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا يوجد عملاء</TableCell></TableRow>
              ) : customers.map(c => (
                <TableRow key={c.phone}>
                  <TableCell className="font-medium">{c.customerName}</TableCell>
                  <TableCell dir="ltr" className="text-right">{c.phone}</TableCell>
                  <TableCell className="text-sm">{c.governorate}</TableCell>
                  <TableCell>{c.orderCount}</TableCell>
                  <TableCell className="font-bold text-primary">{c.totalSpending} ج.م</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(c.lastOrderDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="h-8 bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20">
                        مراسلة
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function InventoryTab() {
  const { data: inventory, isLoading } = useGetInventory();
  const updateStock = useUpdateStock();
  const queryClient = useQueryClient();
  
  const [stockFilter, setStockFilter] = useState<"all"|"low_stock"|"out_of_stock">("all");
  const [editingStock, setEditingStock] = useState<{[bookId: number]: number}>({});

  const filtered = (inventory || []).filter(i => 
    stockFilter === "all" ? true : i.status === stockFilter
  );

  const outOfStockCount = inventory?.filter(i => i.status === 'out_of_stock').length || 0;
  const lowStockCount = inventory?.filter(i => i.status === 'low_stock').length || 0;

  const handleStockSave = (bookId: number) => {
    const newStock = editingStock[bookId];
    if (newStock === undefined) return;
    updateStock.mutate({ data: { bookId, stock: newStock } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        setEditingStock(prev => { const n = {...prev}; delete n[bookId]; return n; });
        toast.success("تم تحديث المخزون");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold mb-1">المخزون</h1>
        <p className="text-muted-foreground">إدارة كميات الكتب المتاحة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">إجمالي الكتب</div>
            <div className="text-3xl font-bold">{inventory?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-yellow-600 mb-2">مخزون منخفض</div>
            <div className="text-3xl font-bold text-yellow-500">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-destructive mb-2">نفد المخزون</div>
            <div className="text-3xl font-bold text-destructive">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-border/50 pb-4">
        <Button variant={stockFilter === "all" ? "default" : "outline"} onClick={() => setStockFilter("all")}>الكل</Button>
        <Button variant={stockFilter === "low_stock" ? "secondary" : "outline"} className={stockFilter === "low_stock" ? "bg-yellow-500/20 text-yellow-500" : "text-yellow-500"} onClick={() => setStockFilter("low_stock")}>مخزون منخفض</Button>
        <Button variant={stockFilter === "out_of_stock" ? "destructive" : "outline"} className={stockFilter === "out_of_stock" ? "" : "text-destructive"} onClick={() => setStockFilter("out_of_stock")}>نفد المخزون</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-12">الغلاف</TableHead>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">المبيعات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin text-primary mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا يوجد كتب بهذا التصنيف</TableCell></TableRow>
              ) : filtered.map(i => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="w-10 h-14 bg-muted rounded overflow-hidden">
                      {i.coverImage && <img src={i.coverImage} className="w-full h-full object-cover" alt="" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-sm">{i.titleAr}</TableCell>
                  <TableCell className="text-sm">{i.category}</TableCell>
                  <TableCell>{i.soldCount}</TableCell>
                  <TableCell>
                    <Badge status={i.status} />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      className="w-20 h-8 text-center" 
                      value={editingStock[i.id] !== undefined ? editingStock[i.id] : i.stock}
                      onChange={e => setEditingStock({...editingStock, [i.id]: Number(e.target.value)})}
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      className="h-8"
                      disabled={editingStock[i.id] === undefined || editingStock[i.id] === i.stock || updateStock.isPending}
                      onClick={() => handleStockSave(i.id)}
                    >
                      حفظ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function AnalyticsTab() {
  const [period, setPeriod] = useState<"7d"|"30d"|"90d">("30d");
  const { data: analytics, isLoading } = useGetAnalytics({ period }, { query: { queryKey: getGetAnalyticsQueryKey({ period }) } });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">التحليلات</h1>
          <p className="text-muted-foreground">تقارير أداء المتجر</p>
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          <Button variant={period === "7d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("7d")}>آخر 7 أيام</Button>
          <Button variant={period === "30d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("30d")}>آخر 30 يوم</Button>
          <Button variant={period === "90d" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("90d")}>آخر 90 يوم</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-primary mb-2">إجمالي الإيرادات</div>
            <div className="text-3xl font-bold">{isLoading ? "-" : `${analytics?.totalRevenue?.toLocaleString()} ج.م`}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">إجمالي الطلبات</div>
            <div className="text-3xl font-bold">{isLoading ? "-" : analytics?.totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">المبيعات اليومية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
             {isLoading ? <div className="flex justify-center p-8 h-full items-center"><Loader2 className="animate-spin text-primary" /></div> : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={analytics?.dailySales ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                   <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => format(new Date(v), 'dd/MM')} />
                   <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                   <Tooltip 
                     cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                     contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                     formatter={(val: number) => [`${val} ج.م`, 'الإيرادات']}
                     labelFormatter={(label) => format(new Date(label), 'PPP')}
                   />
                   <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الكتب الأكثر مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div> : 
                analytics?.topBooks?.map((b, i) => (
                  <div key={b.bookId} className="flex items-center gap-4">
                    <div className="w-8 text-center font-bold text-muted-foreground">#{i+1}</div>
                    <div className="w-10 h-14 bg-muted rounded overflow-hidden shrink-0">
                      {b.coverImage && <img src={b.coverImage} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{b.titleAr}</div>
                      <div className="text-xs text-muted-foreground">{b.soldCount} نسخة مباعة</div>
                    </div>
                    <div className="font-bold text-primary whitespace-nowrap">{b.revenue} ج.م</div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الإيرادات حسب التصنيف</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
              {isLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div> : 
                analytics?.categoryRevenue?.map((c) => {
                  const maxRev = Math.max(...(analytics.categoryRevenue?.map(x => x.revenue) || [1]));
                  const pct = Math.max(5, (c.revenue / maxRev) * 100);
                  return (
                    <div key={c.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{c.category}</span>
                        <span className="font-bold">{c.revenue} ج.م</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const settingsSchema = z.object({
  whatsappNumber: z.string().optional(),
  whatsappEnabled: z.boolean().default(true),
  ownerMessageTemplate: z.string().optional(),
  customerMessageTemplate: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  lowStockThreshold: z.coerce.number().min(0).default(5),
});

function SettingsTab() {
  const { data: settings, isLoading } = useGetSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      whatsappNumber: "", whatsappEnabled: true, ownerMessageTemplate: "", customerMessageTemplate: "",
      heroTitle: "", heroSubtitle: "", lowStockThreshold: 5
    }
  });

  useEffect(() => {
    if (settings) form.reset(settings as any);
  }, [settings, form]);

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    updateSettings.mutate({ data: data as any }, {
      onSuccess: () => toast.success("تم حفظ الإعدادات")
    });
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold mb-1">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة إعدادات المتجر</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">إعدادات واتساب</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="whatsappEnabled" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">تفعيل إشعارات واتساب</FormLabel>
                    <div className="text-sm text-muted-foreground">إرسال إشعارات للعملاء والمالك عند الطلب</div>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                <FormItem><FormLabel>رقم واتساب المالك</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="ownerMessageTemplate" render={({ field }) => (
                <FormItem>
                  <FormLabel>نموذج رسالة المالك</FormLabel>
                  <FormControl><Textarea className="h-32" {...field} /></FormControl>
                  <div className="text-xs text-muted-foreground">متغيرات: {'{orderId}'} {'{customerName}'} {'{phone}'} {'{address}'} {'{items}'} {'{total}'} {'{date}'} {'{notes}'}</div>
                </FormItem>
              )} />
              <FormField control={form.control} name="customerMessageTemplate" render={({ field }) => (
                <FormItem>
                  <FormLabel>نموذج رسالة العميل</FormLabel>
                  <FormControl><Textarea className="h-24" {...field} /></FormControl>
                  <div className="text-xs text-muted-foreground">متغيرات: {'{orderId}'} {'{total}'}</div>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">إعدادات الصفحة الرئيسية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="heroTitle" render={({ field }) => (
                <FormItem><FormLabel>عنوان البانر</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
                <FormItem><FormLabel>النص الفرعي</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">إعدادات المخزون</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (
                <FormItem className="max-w-xs"><FormLabel>حد المخزون المنخفض</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={updateSettings.isPending} className="w-full sm:w-auto">
            {updateSettings.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function LogsTab() {
  const { data: logs, isLoading } = useListActivityLogs();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold mb-1">سجل النشاط</h1>
        <p className="text-muted-foreground">تتبع حركات المشرفين</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ والوقت</TableHead>
                <TableHead className="text-right">الإجراء</TableHead>
                <TableHead className="text-right">التفاصيل</TableHead>
                <TableHead className="text-right">المشرف</TableHead>
                <TableHead className="text-right">عنوان IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin text-primary mx-auto" /></TableCell></TableRow>
              ) : !logs || logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد نشاط مسجل</TableCell></TableRow>
              ) : logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm whitespace-nowrap">{format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell className="font-medium text-sm">{l.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{l.details}</TableCell>
                  <TableCell className="text-sm">{l.adminName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground" dir="ltr">{l.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// --- Helpers ---

function Badge({ status }: { status: string }) {
  switch (status) {
    case 'new': return <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-500">جديد</span>;
    case 'confirmed': return <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">مؤكد</span>;
    case 'processing': return <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-500">قيد التجهيز</span>;
    case 'shipped': return <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-500">تم الشحن</span>;
    case 'delivered': return <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-500">تم التوصيل</span>;
    case 'cancelled': return <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-500">ملغي</span>;
    case 'in_stock': return <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-500">متوفر</span>;
    case 'low_stock': return <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">منخفض</span>;
    case 'out_of_stock': return <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-500">نفد</span>;
    default: return <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{status}</span>;
  }
}

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

function BookDialog({ mode, book }: { mode: 'create' | 'edit', book?: any }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: book || {
      title: '', titleAr: '', author: '', authorAr: '', description: '', descriptionAr: '',
      coverImage: '', price: 0, originalPrice: undefined, category: 'fantasy', stock: 10,
      isFeatured: false, isBestSeller: false, isNewArrival: false, isOnSale: false
    }
  });

  const onSubmit = (data: z.infer<typeof bookSchema>) => {
    const cleanData = { ...data, originalPrice: data.originalPrice ?? undefined };
    if (mode === 'create') {
      createBook.mutate({ data: cleanData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey() });
          setOpen(false);
          form.reset();
          toast.success("تم إضافة الكتاب بنجاح");
        }
      });
    } else {
      updateBook.mutate({ id: book.id, data: cleanData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          setOpen(false);
          toast.success("تم تعديل بيانات الكتاب");
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="w-4 h-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
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
                <FormItem className="col-span-2"><FormLabel>الوصف (عربي)</FormLabel><FormControl><Textarea className="h-20" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>الوصف (انجليزي)</FormLabel><FormControl><Textarea className="h-20" dir="ltr" {...field} /></FormControl></FormItem>
              )} />
            </div>

            <div className="flex flex-wrap gap-6 p-4 bg-muted/20 rounded-lg border border-border/50">
              <FormField control={form.control} name="isFeatured" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="m-0 cursor-pointer">مختارات (Featured)</FormLabel></FormItem>
              )} />
              <FormField control={form.control} name="isBestSeller" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="m-0 cursor-pointer">الأكثر مبيعاً</FormLabel></FormItem>
              )} />
              <FormField control={form.control} name="isNewArrival" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="m-0 cursor-pointer">وصل حديثاً</FormLabel></FormItem>
              )} />
              <FormField control={form.control} name="isOnSale" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="m-0 cursor-pointer">عرض خاص (Sale)</FormLabel></FormItem>
              )} />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createBook.isPending || updateBook.isPending}>حفظ</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
