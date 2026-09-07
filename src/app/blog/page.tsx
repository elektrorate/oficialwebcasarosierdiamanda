import type { Metadata } from "next";
import { BlogIndexPage } from "@/features/blog/BlogIndexPage";

export const revalidate = 900;

export const metadata: Metadata = {
  title: { absolute: "Blog | Casa Rosier Ceramica" },
  description:
    "Articulos, procesos y reflexiones sobre ceramica, talleres, tecnicas y creacion en Casa Rosier Ceramica Barcelona.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return <BlogIndexPage />;
}
