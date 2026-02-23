import { Suspense } from "react";
import { ProcessBuilder } from "@/components/process-builder/process-builder";

function BuilderPageFallback() {
  return (
    <main className="page-shell">
      <p className="page-copy">Loading builder...</p>
    </main>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<BuilderPageFallback />}>
      <ProcessBuilder />
    </Suspense>
  );
}
