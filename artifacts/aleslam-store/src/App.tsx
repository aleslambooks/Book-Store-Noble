import { Suspense, lazy, Component, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/hooks/use-cart";
import { AdminAuthProvider } from "@/hooks/use-admin-auth";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/home"));
const Books = lazy(() => import("@/pages/books"));
const BookDetail = lazy(() => import("@/pages/book-detail"));
const Cart = lazy(() => import("@/pages/cart"));
const Checkout = lazy(() => import("@/pages/checkout"));
const TrackOrder = lazy(() => import("@/pages/track-order"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 } },
});

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold">حدث خطأ</h2>
          <p className="text-muted-foreground max-w-md">{this.state.message}</p>
          <button
            className="mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => {
              this.setState({ hasError: false, message: "" });
              window.location.href = "/";
            }}
          >
            العودة للرئيسية
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
