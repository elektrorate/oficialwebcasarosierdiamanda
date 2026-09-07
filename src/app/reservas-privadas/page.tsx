import { permanentRedirect } from "next/navigation";

export default async function PrivateExperiencesPage() {
  permanentRedirect("/experiencias");
}
