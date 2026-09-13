import type { Metadata } from "next";
import { HomePage as HomeScreen } from "@/features/home/HomePage";
import "./legacy/home.css";
import "../components/home/gift-carousel.css";
import "../components/home/social-gallery-home.css";
import "../components/layout/scroll-nav/home-scroll-sticky-nav.css";

export const revalidate = 900;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeScreen />;
}
