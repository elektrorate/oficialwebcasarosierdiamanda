import type { Metadata } from "next";
import { DirectionsMap } from "@/components/location/DirectionsMap";

export const metadata: Metadata = {
  title: "Cómo llegar",
  description: "Ruta a pie desde Metro Hospital Clínic hasta Casa Rosier, en Carrer de Villarroel 204, Barcelona.",
  alternates: { canonical: "/como-llegar" },
};

export default function DirectionsPage() {
  return <DirectionsMap />;
}
