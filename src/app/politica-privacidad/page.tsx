import type { Metadata } from "next";
import { PrivacyPolicyPage } from "@/features/legal/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Política de privacidad de Casa Rosier.",
  alternates: { canonical: "/politica-privacidad" },
};

export const revalidate = 900;

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
