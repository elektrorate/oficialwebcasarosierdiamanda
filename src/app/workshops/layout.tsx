import type { ReactNode } from "react";
import { OfferingRouteLayout } from "@/components/layout/OfferingRouteStyles";

export default function OfferingLayout({ children }: { children: ReactNode }) {
  return <OfferingRouteLayout>{children}</OfferingRouteLayout>;
}
