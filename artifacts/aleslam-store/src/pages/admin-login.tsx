import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useAdminLogin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export default function AdminLogin() {
  const { login, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useAdminLogin();
  
  useEffect(() => {
    if (isAuthenticated) setLocation("/admin");
  }, [isAuthenticated, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.admin);
        setLocation("/admin");
      },
      onError: () => {
        form.setError("root", { message: "بيانات الدخول غير صحيحة" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground" dir="rtl">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl shadow-primary/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center border border-primary/20">
            <span className="text-3xl">🕯️</span>
          </div>
          <CardTitle className="text-2xl font-bold font-serif text-primary">لوحة تحكم المكتبة</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl><Input type="email" dir="ltr" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl><Input type="password" dir="ltr" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "جاري الدخول..." : "دخول"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            تلميح: admin@aleslam.com / aleslam2024
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
