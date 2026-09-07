import { permanentRedirect } from "next/navigation";

export default async function GiftCardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  permanentRedirect(`/gift-cards/${(await params).slug}`);
}
