import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
