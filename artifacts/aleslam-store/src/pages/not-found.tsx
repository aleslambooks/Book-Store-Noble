import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <span className="text-7xl">🕯️</span>
      <h1 className="text-6xl font-black text-primary">404</h1>
      <h2 className="text-2xl font-bold">الصفحة غير موجودة</h2>
      <p className="text-muted-foreground max-w-md">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها.
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-full px-8 mt-2">
          العودة للرئيسية
        </Button>
      </Link>
    </div>
  );
}
