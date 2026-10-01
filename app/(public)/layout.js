import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
