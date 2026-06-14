"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RefreshPage() {
  const router = useRouter();

  useEffect(() => {
    // Poll the server state by refreshing page data every 3 seconds
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
