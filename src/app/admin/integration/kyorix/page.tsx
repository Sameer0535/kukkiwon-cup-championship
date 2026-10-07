"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function KyorixIntegrationPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-400 text-sm">
      <p>Redirecting to Admin Overview...</p>
    </div>
  );
}
