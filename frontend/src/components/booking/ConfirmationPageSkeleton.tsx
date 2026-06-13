import { Loader2 } from "lucide-react";

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export function ConfirmationPageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-6 py-4">
        <SkeletonLine className="h-4 w-32" />
      </div>

      <div className="flex justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          <div className="rounded-xl border border-border bg-card px-6 py-8 shadow-lg sm:px-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
              <SkeletonLine className="mx-auto mt-5 h-6 w-56" />
              <SkeletonLine className="mx-auto mt-3 h-4 w-72 max-w-full" />
            </div>

            <div className="mt-8 space-y-6 border-t border-border pt-8">
              {(["What", "When", "Who", "Where"] as const).map((label) => (
                <div key={label} className="grid gap-2 sm:grid-cols-[5rem_1fr] sm:gap-6">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <div className="space-y-2">
                    <SkeletonLine className="h-4 w-full max-w-xs" />
                    {label === "When" && <SkeletonLine className="h-4 w-40" />}
                    {label === "Who" && (
                      <>
                        <SkeletonLine className="h-4 w-48" />
                        <SkeletonLine className="h-3 w-36" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">Cal.com</p>
        </div>
      </div>
    </div>
  );
}
