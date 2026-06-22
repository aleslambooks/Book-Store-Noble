import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/hooks/use-cart";
import { AdminAuthProvider } from "@/hooks/use-admin-auth";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

import Home from "@/pages/home";
import Books from "@/pages/books";
import BookDetail from "@/pages/book-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import TrackOrder from "@/pages/track-order";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/books" component={Books} />
      <Route path="/books/:id" component={BookDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/track" component={TrackOrder} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminProtectedRoute><Admin /></AdminProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AdminAuthProvider>
            <CartProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </CartProvider>
          </AdminAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
