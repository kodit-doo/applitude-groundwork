import { Suspense } from "react";
import DiscoverFlow from "@/components/DiscoverFlow";

export default function DiscoverPage() {
  return (
    <div className="h-screen overflow-hidden">
      <Suspense fallback={null}>
        <DiscoverFlow />
      </Suspense>
    </div>
  );
}
