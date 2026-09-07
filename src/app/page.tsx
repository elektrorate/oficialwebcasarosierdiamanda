import type { Metadata } from "next";
import { HomePage as HomeScreen } from "@/features/home/HomePage";

export const revalidate = 900;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeScreen />;
}
