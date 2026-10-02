export interface AdminNavLink {
  label: string;
  href: string;
  activePaths?: string[];
}

export interface AdminNavSection {
  label: string;
  icon: string;
  href?: string;
  children?: AdminNavLink[];
}

export const adminRoutes = {
  dashboard: "/admin/dashboard",
  classes: "/admin/clases",
  newClass: "/admin/clases/new",
  links: "/admin/links",
  workshops: "/admin/workshops",
  experiences: "/admin/experiencias",
  giftCards: "/admin/gift-cards",
  reservations: "/admin/reservas",
  pages: "/admin/pages",
  home: "/admin/home",
  studio: "/admin/estudio",
  landingPages: "/admin/landing-pages",
  blog: "/admin/bitacora",
  redirects: "/admin/redirecciones",
  forms: "/admin/formularios",
  messages: "/admin/mensajes",
  headers: "/admin/components/headers",
  socialGalleries: "/admin/components/social-galleries",
  testimonials: "/admin/components/testimonials",
  footers: "/admin/components/footers",
  promoBanners: "/admin/components/promo-banners",
  faqs: "/admin/components/faqs",
  teachers: "/admin/components/teachers",
  menus: "/admin/menu",
  shop: "/admin/shop",
  products: "/admin/shop/products",
  categories: "/admin/shop/categories",
  orders: "/admin/shop/orders",
  coupons: "/admin/shop/coupons",
  shipping: "/admin/shop/shipping",
  media: "/admin/media",
  users: "/admin/users",
  settings: "/admin/settings",
  marketing: "/admin/marketing",
  marketingAnalytics: "/admin/marketing/analytics",
  marketingSearchConsole: "/admin/marketing/search-console",
  marketingPages: "/admin/marketing/pages",
  marketingEvents: "/admin/marketing/events",
  marketingCampaigns: "/admin/marketing/campaigns",
  marketingConversions: "/admin/marketing/conversions",
  marketingSeo: "/admin/marketing/seo",
  marketingReports: "/admin/marketing/reports",
  marketingSettings: "/admin/marketing/settings",
  legal: "/admin/legal-cookies",
  historyLogs: "/admin/history-logs",
  trash: "/admin/trash",
} as const;

export const adminSections: AdminNavSection[] = [
  { label: "Dashboard", icon: "home", href: adminRoutes.dashboard },
  { label: "Links externos", icon: "link", href: adminRoutes.links },
  {
    label: "Actividades",
    icon: "school",
    children: [
      { label: "Experiencias", href: adminRoutes.experiences },
      { label: "Cursos", href: adminRoutes.classes },
      { label: "Workshops", href: adminRoutes.workshops },
      { label: "Gift Cards", href: adminRoutes.giftCards },
      { label: "Reservas", href: adminRoutes.reservations },
    ],
  },
  {
    label: "Contenido",
    icon: "description",
    children: [
      { label: "Home", href: adminRoutes.home },
      // Páginas se mantiene como ruta interna editable, pero se oculta del menú porque no es una sección de uso directo para el CMS diario.
      { label: "Mensajes", href: adminRoutes.messages },
    ],
  },
  {
    label: "Comunidad",
    icon: "groups",
    children: [
      { label: "El estudio", href: adminRoutes.studio },
      { label: "Bitácora", href: adminRoutes.blog },
    ],
  },
  {
    label: "Componentes",
    icon: "extension",
    children: [
      { label: "Headers", href: adminRoutes.headers },
      { label: "Footer", href: adminRoutes.footers },
      { label: "Formularios", href: adminRoutes.forms },
      // FAQs global se conserva como ruta interna legacy, pero se oculta del menú: ahora cada página gestiona su FAQ personalizado desde Adiciones.
      { label: "Galerías sociales", href: adminRoutes.socialGalleries },
      { label: "Testimonios", href: adminRoutes.testimonials },
      { label: "Banners promocionales", href: adminRoutes.promoBanners },
    ],
  },
  {
    label: "Shop",
    icon: "storefront",
    children: [
      { label: "Página de Shop", href: adminRoutes.shop },
      {
        label: "Productos",
        href: adminRoutes.products,
        activePaths: [adminRoutes.products, `${adminRoutes.shop}?tab=items`],
      },
      { label: "Categorías", href: adminRoutes.categories },
      { label: "Pedidos", href: adminRoutes.orders },
      { label: "Cupones", href: adminRoutes.coupons },
      { label: "Envíos", href: adminRoutes.shipping },
    ],
  },
  {
    label: "Marketing",
    icon: "analytics",
    children: [
      { label: "Resumen", href: adminRoutes.marketing },
      { label: "Analytics", href: adminRoutes.marketingAnalytics },
      { label: "Search Console", href: adminRoutes.marketingSearchConsole },
      { label: "SEO", href: adminRoutes.marketingSeo },
      { label: "Rendimiento de páginas", href: adminRoutes.marketingPages },
      { label: "Eventos", href: adminRoutes.marketingEvents },
      { label: "Campañas UTM", href: adminRoutes.marketingCampaigns },
      { label: "Conversiones", href: adminRoutes.marketingConversions },
      { label: "Landing Pages", href: adminRoutes.landingPages },
      { label: "Reportes", href: adminRoutes.marketingReports },
      { label: "Configuración de marketing", href: adminRoutes.marketingSettings },
    ],
  },
  {
    label: "Configuración",
    icon: "settings",
    children: [
      { label: "Menú", href: adminRoutes.menus },
      { label: "Multimedia", href: adminRoutes.media },
      { label: "Redirecciones", href: adminRoutes.redirects },
      { label: "Usuarios", href: adminRoutes.users },
      { label: "Privacidad y cookies", href: adminRoutes.legal },
      { label: "Configuración general", href: adminRoutes.settings },
      { label: "Historial de actividad", href: adminRoutes.historyLogs },
      { label: "Papelera", href: adminRoutes.trash },
    ],
  },
];
