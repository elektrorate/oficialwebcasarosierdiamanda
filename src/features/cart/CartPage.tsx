import { HeaderInterno } from "@/components/layout/HeaderInterno";
import { Cart } from "@/components/shop/Cart";
import { SitePage } from "@/features/shared/layout/SitePage";
import { getWhatsappHref } from "@/lib/whatsapp";

export async function CartPage() {
  const whatsappHref = await getWhatsappHref();

  return (
    <SitePage
      bodyClass="cart-page"
      header={<HeaderInterno eyebrow="Resumen del pedido" title="Carrito" />}
    >
      <section className="cart section pt-9 pb-24">
        <div className="container cart__container max-w-290">
          <Cart whatsappHref={whatsappHref} />
        </div>
      </section>
    </SitePage>
  );
}
