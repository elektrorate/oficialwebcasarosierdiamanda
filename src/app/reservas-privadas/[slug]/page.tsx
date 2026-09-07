import { permanentRedirect } from "next/navigation";

export default async function PrivateExperienceDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  permanentRedirect(`/experiencias/${(await params).slug}`);
}
