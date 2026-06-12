import { Suspense } from "react";
import { BookPageContent } from "./BookPageContent";

export default function BookPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#101010]">
          <p className="text-sm text-[#9ca3af]">Loading…</p>
        </div>
      }
    >
      <BookPageContent slug={params.slug} />
    </Suspense>
  );
}
