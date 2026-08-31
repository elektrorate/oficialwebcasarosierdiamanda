import { getWhatsappHref } from "@/lib/whatsapp";

export async function WhatsAppFloat() {
  const href = await getWhatsappHref();

  return (
    <a
      href={href}
      aria-label="Escribenos por WhatsApp"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4.5 bottom-4.5 z-1300 flex h-14.5 w-14.5 items-center justify-center rounded-full bg-[#25d366] shadow-[0_14px_28px_rgba(37,211,102,0.22)] transition-[transform,box-shadow] duration-180 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(37,211,102,0.28)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_18px_34px_rgba(37,211,102,0.28)] focus-visible:outline-none max-[640px]:right-3.5 max-[640px]:bottom-3.5 max-[640px]:h-13.5 max-[640px]:w-13.5"
    >
      <img
        src="/img/icon-whatsapp.svg"
        alt=""
        className="h-6.5 w-6.5 filter-[brightness(0)_invert(1)]"
      />
    </a>
  );
}