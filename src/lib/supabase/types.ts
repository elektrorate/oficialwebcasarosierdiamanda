// Auto-generated from Supabase schema — do not edit by hand
// Generated at: 2026-06-28T10:11:54.871Z

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      blog_page_settings: { Row: BlogPageSettingRow; Insert: BlogPageSettingInsert; Update: BlogPageSettingUpdate; };
      blog_post_blocks: { Row: BlogPostBlockRow; Insert: BlogPostBlockInsert; Update: BlogPostBlockUpdate; };
      blog_posts: { Row: BlogPostRow; Insert: BlogPostInsert; Update: BlogPostUpdate; };
      coupons: { Row: CouponRow; Insert: CouponInsert; Update: CouponUpdate; };
      faq_groups: { Row: FaqGroupRow; Insert: FaqGroupInsert; Update: FaqGroupUpdate; };
      faqs: { Row: FaqRow; Insert: FaqInsert; Update: FaqUpdate; };
      footers: { Row: FooterRow; Insert: FooterInsert; Update: FooterUpdate; };
      form_fields: { Row: FormFieldRow; Insert: FormFieldInsert; Update: FormFieldUpdate; };
      form_submissions: { Row: FormSubmissionRow; Insert: FormSubmissionInsert; Update: FormSubmissionUpdate; };
      forms: { Row: FormRow; Insert: FormInsert; Update: FormUpdate; };
      headers: { Row: HeaderRow; Insert: HeaderInsert; Update: HeaderUpdate; };
      history_logs: { Row: HistoryLogRow; Insert: HistoryLogInsert; Update: HistoryLogUpdate; };
      landing_page_blocks: { Row: LandingPageBlockRow; Insert: LandingPageBlockInsert; Update: LandingPageBlockUpdate; };
      landing_pages: { Row: LandingPageRow; Insert: LandingPageInsert; Update: LandingPageUpdate; };
      legal_settings: { Row: LegalSettingRow; Insert: LegalSettingInsert; Update: LegalSettingUpdate; };
      media_assets: { Row: MediaAssetRow; Insert: MediaAssetInsert; Update: MediaAssetUpdate; };
      menu_visual_settings: { Row: MenuVisualSettingRow; Insert: MenuVisualSettingInsert; Update: MenuVisualSettingUpdate; };
      menu_items: { Row: MenuItemRow; Insert: MenuItemInsert; Update: MenuItemUpdate; };
      menus: { Row: MenuRow; Insert: MenuInsert; Update: MenuUpdate; };
      offering_gallery_items: { Row: OfferingGalleryItemRow; Insert: OfferingGalleryItemInsert; Update: OfferingGalleryItemUpdate; };
      offering_prices: { Row: OfferingPriceRow; Insert: OfferingPriceInsert; Update: OfferingPriceUpdate; };
      offering_schedules: { Row: OfferingScheduleRow; Insert: OfferingScheduleInsert; Update: OfferingScheduleUpdate; };
      offerings: { Row: OfferingRow; Insert: OfferingInsert; Update: OfferingUpdate; };
      order_items: { Row: OrderItemRow; Insert: OrderItemInsert; Update: OrderItemUpdate; };
      orders: { Row: OrderRow; Insert: OrderInsert; Update: OrderUpdate; };
      page_blocks: { Row: PageBlockRow; Insert: PageBlockInsert; Update: PageBlockUpdate; };
      pages: { Row: PageRow; Insert: PageInsert; Update: PageUpdate; };
      product_categories: { Row: ProductCategoryRow; Insert: ProductCategoryInsert; Update: ProductCategoryUpdate; };
      products: { Row: ProductRow; Insert: ProductInsert; Update: ProductUpdate; };
      profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: ProfileUpdate; };
      promo_banners: { Row: PromoBannerRow; Insert: PromoBannerInsert; Update: PromoBannerUpdate; };
      redirects: { Row: RedirectRow; Insert: RedirectInsert; Update: RedirectUpdate; };
      reservations: { Row: ReservationRow; Insert: ReservationInsert; Update: ReservationUpdate; };
      shipping_methods: { Row: ShippingMethodRow; Insert: ShippingMethodInsert; Update: ShippingMethodUpdate; };
      site_settings: { Row: SiteSettingRow; Insert: SiteSettingInsert; Update: SiteSettingUpdate; };
      social_galleries: { Row: SocialGalleryRow; Insert: SocialGalleryInsert; Update: SocialGalleryUpdate; };
      social_gallery_items: { Row: SocialGalleryItemRow; Insert: SocialGalleryItemInsert; Update: SocialGalleryItemUpdate; };
      teachers: { Row: TeacherRow; Insert: TeacherInsert; Update: TeacherUpdate; };
      testimonials: { Row: TestimonialRow; Insert: TestimonialInsert; Update: TestimonialUpdate; };
      trash_items: { Row: TrashItemRow; Insert: TrashItemInsert; Update: TrashItemUpdate; };
    };
  };
}

export interface BlogPageSettingRow {
  id: string;
  status: string;
  hero: Json;
  show_idea_prompt_section: boolean;
  seo_title: string;
  seo_description: string;
  seo_image: string;
  updated_at: string;
}

export interface BlogPageSettingInsert {
  id: string;
  status?: string;
  hero?: Json;
  show_idea_prompt_section?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
  updated_at?: string;
}

export interface BlogPageSettingUpdate {
  id?: string;
  status?: string;
  hero?: Json;
  show_idea_prompt_section?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
  updated_at?: string;
}

export interface BlogPostBlockRow {
  id: string;
  blog_post_id: string;
  type: string;
  title: string | null;
  text: string | null;
  image_id: string | null;
  source_url: string | null;
  is_visible: boolean;
  sort_order: number;
  custom_html: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostBlockInsert {
  id?: string;
  blog_post_id: string;
  type?: string;
  title?: string | null;
  text?: string | null;
  image_id?: string | null;
  source_url?: string | null;
  is_visible?: boolean;
  sort_order?: number;
  custom_html?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPostBlockUpdate {
  id?: string;
  blog_post_id?: string;
  type?: string;
  title?: string | null;
  text?: string | null;
  image_id?: string | null;
  source_url?: string | null;
  is_visible?: boolean;
  sort_order?: number;
  custom_html?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  excerpt: string | null;
  content: string | null;
  featured_image_id: string | null;
  author_id: string | null;
  category: string;
  tags: Json;
  is_featured: boolean;
  featured_order: number;
  featured_excerpt: string | null;
  visible_in_listing: boolean;
  sort_order: number;
  published_at: string | null;
  reading_time: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  hero: Json;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BlogPostInsert {
  id?: string;
  title: string;
  slug: string;
  status?: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image_id?: string | null;
  author_id?: string | null;
  category?: string;
  tags: Json;
  is_featured?: boolean;
  featured_order?: number;
  featured_excerpt?: string | null;
  visible_in_listing?: boolean;
  sort_order?: number;
  published_at?: string | null;
  reading_time?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  hero?: Json;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface BlogPostUpdate {
  id?: string;
  title?: string;
  slug?: string;
  status?: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image_id?: string | null;
  author_id?: string | null;
  category?: string;
  tags?: Json;
  is_featured?: boolean;
  featured_order?: number;
  featured_excerpt?: string | null;
  visible_in_listing?: boolean;
  sort_order?: number;
  published_at?: string | null;
  reading_time?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  hero?: Json;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CouponRow {
  id: string;
  code: string;
  discount_type: string;
  value: number | null;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  used_count: number;
  minimum_order_amount: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CouponInsert {
  id?: string;
  code: string;
  discount_type: string;
  value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  used_count?: number;
  minimum_order_amount?: number | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CouponUpdate {
  id?: string;
  code?: string;
  discount_type?: string;
  value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  used_count?: number;
  minimum_order_amount?: number | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FaqGroupRow {
  id: string;
  title: string;
  description: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FaqGroupInsert {
  id?: string;
  title: string;
  description?: string;
  status?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FaqGroupUpdate {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FaqRow {
  id: string;
  question: string;
  answer: string | null;
  category: string;
  faq_group_id: string | null;
  topic_title: string;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FaqInsert {
  id?: string;
  question: string;
  answer?: string | null;
  category?: string;
  faq_group_id?: string | null;
  topic_title?: string;
  sort_order?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FaqUpdate {
  id?: string;
  question?: string;
  answer?: string | null;
  category?: string;
  faq_group_id?: string | null;
  topic_title?: string;
  sort_order?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FooterRow {
  id: string;
  name: string;
  status: string;
  logo_id: string | null;
  contact_email: string | null;
  whatsapp: string | null;
  address: string | null;
  legal_text: string | null;
  social_links: Json;
  menu_id: string | null;
  newsletter_enabled: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FooterInsert {
  id?: string;
  name: string;
  status?: string;
  logo_id?: string | null;
  contact_email?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  legal_text?: string | null;
  social_links: Json;
  menu_id?: string | null;
  newsletter_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FooterUpdate {
  id?: string;
  name?: string;
  status?: string;
  logo_id?: string | null;
  contact_email?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  legal_text?: string | null;
  social_links?: Json;
  menu_id?: string | null;
  newsletter_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FormFieldRow {
  id: string;
  form_id: string;
  label: string;
  name: string;
  type: string;
  placeholder: string | null;
  required: boolean;
  options: Json;
  default_value: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormFieldInsert {
  id?: string;
  form_id: string;
  label: string;
  name: string;
  type?: string;
  placeholder?: string | null;
  required?: boolean;
  options: Json;
  default_value?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FormFieldUpdate {
  id?: string;
  form_id?: string;
  label?: string;
  name?: string;
  type?: string;
  placeholder?: string | null;
  required?: boolean;
  options?: Json;
  default_value?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmissionRow {
  id: string;
  form_id: string;
  form_slug: string | null;
  form_name: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  data: Json;
  source_page: string | null;
  status: string;
  internal_notes: string | null;
  notification_status: string | null;
  notification_provider: string | null;
  notification_to: string | null;
  notification_from: string | null;
  notification_message_id: string | null;
  notification_error: string | null;
  notification_attempted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FormSubmissionInsert {
  id?: string;
  form_id: string;
  form_slug?: string | null;
  form_name?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message?: string | null;
  data: Json;
  source_page?: string | null;
  status?: string;
  internal_notes?: string | null;
  notification_status?: string | null;
  notification_provider?: string | null;
  notification_to?: string | null;
  notification_from?: string | null;
  notification_message_id?: string | null;
  notification_error?: string | null;
  notification_attempted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FormSubmissionUpdate {
  id?: string;
  form_id?: string;
  form_slug?: string | null;
  form_name?: string | null;
  name?: string;
  email?: string;
  phone?: string | null;
  subject?: string | null;
  message?: string | null;
  data?: Json;
  source_page?: string | null;
  status?: string;
  internal_notes?: string | null;
  notification_status?: string | null;
  notification_provider?: string | null;
  notification_to?: string | null;
  notification_from?: string | null;
  notification_message_id?: string | null;
  notification_error?: string | null;
  notification_attempted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FormRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  title: string | null;
  description: string | null;
  success_message: string;
  redirect_url: string | null;
  email_notification_enabled: boolean;
  notification_email: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FormInsert {
  id?: string;
  name: string;
  slug: string;
  type: string;
  status?: string;
  title?: string | null;
  description?: string | null;
  success_message?: string;
  redirect_url?: string | null;
  email_notification_enabled?: boolean;
  notification_email?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FormUpdate {
  id?: string;
  name?: string;
  slug?: string;
  type?: string;
  status?: string;
  title?: string | null;
  description?: string | null;
  success_message?: string;
  redirect_url?: string | null;
  email_notification_enabled?: boolean;
  notification_email?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface HeaderRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  title: string | null;
  subtitle: string | null;
  eyebrow: string | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number;
  gradient_enabled: boolean;
  gradient_css: string | null;
  desktop_height: string;
  mobile_height: string;
  content_position: string;
  content_alignment: string;
  menu_color: string;
  logo_variant: string;
  visual_variant: string;
  cta_label: string | null;
  cta_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HeaderInsert {
  id?: string;
  name: string;
  slug: string;
  type?: string;
  status?: string;
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  desktop_image_url?: string | null;
  mobile_image_url?: string | null;
  overlay_enabled?: boolean;
  overlay_color?: string;
  overlay_opacity?: number;
  gradient_enabled?: boolean;
  gradient_css?: string | null;
  desktop_height?: string;
  mobile_height?: string;
  content_position?: string;
  content_alignment?: string;
  menu_color?: string;
  logo_variant?: string;
  visual_variant?: string;
  cta_label?: string | null;
  cta_url?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface HeaderUpdate {
  id?: string;
  name?: string;
  slug?: string;
  type?: string;
  status?: string;
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  desktop_image_url?: string | null;
  mobile_image_url?: string | null;
  overlay_enabled?: boolean;
  overlay_color?: string;
  overlay_opacity?: number;
  gradient_enabled?: boolean;
  gradient_css?: string | null;
  desktop_height?: string;
  mobile_height?: string;
  content_position?: string;
  content_alignment?: string;
  menu_color?: string;
  logo_variant?: string;
  visual_variant?: string;
  cta_label?: string | null;
  cta_url?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface HistoryLogRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string | null;
  old_data: Json | null;
  new_data: Json | null;
  created_at: string;
}

export interface HistoryLogInsert {
  id?: string;
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title?: string | null;
  old_data?: Json | null;
  new_data?: Json | null;
  created_at?: string;
}

export interface HistoryLogUpdate {
  id?: string;
  user_id?: string | null;
  user_email?: string | null;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  entity_title?: string | null;
  old_data?: Json | null;
  new_data?: Json | null;
  created_at?: string;
}

export interface LandingPageBlockRow {
  id: string;
  landing_page_id: string;
  type: string;
  title: string | null;
  text: string | null;
  image_id: string | null;
  source_url: string | null;
  is_visible: boolean;
  sort_order: number;
  custom_html: string | null;
  created_at: string;
  updated_at: string;
  cta_text: string | null;
  cta_url: string | null;
}

export interface LandingPageBlockInsert {
  id?: string;
  landing_page_id: string;
  type?: string;
  title?: string | null;
  text?: string | null;
  image_id?: string | null;
  source_url?: string | null;
  is_visible?: boolean;
  sort_order?: number;
  custom_html?: string | null;
  created_at?: string;
  updated_at?: string;
  cta_text?: string | null;
  cta_url?: string | null;
}

export interface LandingPageBlockUpdate {
  id?: string;
  landing_page_id?: string;
  type?: string;
  title?: string | null;
  text?: string | null;
  image_id?: string | null;
  source_url?: string | null;
  is_visible?: boolean;
  sort_order?: number;
  custom_html?: string | null;
  created_at?: string;
  updated_at?: string;
  cta_text?: string | null;
  cta_url?: string | null;
}

export interface LandingPageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  campaign_type: string;
  header_id: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_id: string | null;
  intro_text: string | null;
  cta_text: string | null;
  cta_url: string | null;
  form_id: string | null;
  social_gallery_id: string | null;
  testimonials_id: string | null;
  footer_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LandingPageInsert {
  id?: string;
  title: string;
  slug: string;
  status?: string;
  campaign_type?: string;
  header_id?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_image_id?: string | null;
  intro_text?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  form_id?: string | null;
  social_gallery_id?: string | null;
  testimonials_id?: string | null;
  footer_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface LandingPageUpdate {
  id?: string;
  title?: string;
  slug?: string;
  status?: string;
  campaign_type?: string;
  header_id?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_image_id?: string | null;
  intro_text?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  form_id?: string | null;
  social_gallery_id?: string | null;
  testimonials_id?: string | null;
  footer_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface LegalSettingRow {
  id: string;
  banner_enabled: boolean;
  banner_text: string | null;
  cookies_banner_title: string | null;
  cookies_banner_text: string | null;
  accept_button_text: string;
  reject_button_text: string;
  preferences_button_text: string;
  consent_categories: Json;
  analytics_consent_required: boolean;
  marketing_consent_required: boolean;
  functional_consent_required: boolean;
  privacy_policy_title: string | null;
  privacy_policy_content: string | null;
  privacy_policy_url: string | null;
  cookies_policy_title: string | null;
  cookies_policy_content: string | null;
  cookie_policy_url: string | null;
  legal_notice_title: string | null;
  legal_notice_content: string | null;
  legal_notice_url: string | null;
  terms_title: string | null;
  terms_content: string | null;
  terms_url: string | null;
  purchase_terms_content: string | null;
  consent_mode_enabled: boolean;
  google_consent_mode_enabled: boolean;
  meta_consent_mode_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LegalSettingInsert {
  id?: string;
  banner_enabled?: boolean;
  banner_text?: string | null;
  cookies_banner_title?: string | null;
  cookies_banner_text?: string | null;
  accept_button_text?: string;
  reject_button_text?: string;
  preferences_button_text?: string;
  consent_categories: Json;
  analytics_consent_required?: boolean;
  marketing_consent_required?: boolean;
  functional_consent_required?: boolean;
  privacy_policy_title?: string | null;
  privacy_policy_content?: string | null;
  privacy_policy_url?: string | null;
  cookies_policy_title?: string | null;
  cookies_policy_content?: string | null;
  cookie_policy_url?: string | null;
  legal_notice_title?: string | null;
  legal_notice_content?: string | null;
  legal_notice_url?: string | null;
  terms_title?: string | null;
  terms_content?: string | null;
  terms_url?: string | null;
  purchase_terms_content?: string | null;
  consent_mode_enabled?: boolean;
  google_consent_mode_enabled?: boolean;
  meta_consent_mode_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LegalSettingUpdate {
  id?: string;
  banner_enabled?: boolean;
  banner_text?: string | null;
  cookies_banner_title?: string | null;
  cookies_banner_text?: string | null;
  accept_button_text?: string;
  reject_button_text?: string;
  preferences_button_text?: string;
  consent_categories?: Json;
  analytics_consent_required?: boolean;
  marketing_consent_required?: boolean;
  functional_consent_required?: boolean;
  privacy_policy_title?: string | null;
  privacy_policy_content?: string | null;
  privacy_policy_url?: string | null;
  cookies_policy_title?: string | null;
  cookies_policy_content?: string | null;
  cookie_policy_url?: string | null;
  legal_notice_title?: string | null;
  legal_notice_content?: string | null;
  legal_notice_url?: string | null;
  terms_title?: string | null;
  terms_content?: string | null;
  terms_url?: string | null;
  purchase_terms_content?: string | null;
  consent_mode_enabled?: boolean;
  google_consent_mode_enabled?: boolean;
  meta_consent_mode_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MediaAssetRow {
  id: string;
  file_name: string;
  original_name: string | null;
  file_url: string;
  file_type: string;
  mime_type: string | null;
  size: number;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  folder: string;
  tags: Json;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MediaAssetInsert {
  id?: string;
  file_name: string;
  original_name?: string | null;
  file_url: string;
  file_type: string;
  mime_type?: string | null;
  size?: number;
  alt_text?: string | null;
  title?: string | null;
  description?: string | null;
  folder?: string;
  tags: Json;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MediaAssetUpdate {
  id?: string;
  file_name?: string;
  original_name?: string | null;
  file_url?: string;
  file_type?: string;
  mime_type?: string | null;
  size?: number;
  alt_text?: string | null;
  title?: string | null;
  description?: string | null;
  folder?: string;
  tags?: Json;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MenuItemRow {
  id: string;
  menu_id: string;
  label: string;
  type: string;
  url: string;
  linked_entity_type: string;
  linked_entity_id: string | null;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
  open_in_new_tab: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemInsert {
  id?: string;
  menu_id: string;
  label: string;
  type?: string;
  url: string;
  linked_entity_type?: string;
  linked_entity_id?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  open_in_new_tab?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemUpdate {
  id?: string;
  menu_id?: string;
  label?: string;
  type?: string;
  url?: string;
  linked_entity_type?: string;
  linked_entity_id?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  open_in_new_tab?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MenuVisualSettingRow {
  id: string;
  key: string;
  header_logo_url: string;
  scroll_menu_background_color: string;
  scroll_menu_text_color: string;
  scroll_menu_icon_color: string;
  scroll_menu_logo_tint_enabled: boolean;
  scroll_menu_logo_tint_color: string;
  created_at: string;
  updated_at: string;
}

export interface MenuVisualSettingInsert {
  id?: string;
  key?: string;
  header_logo_url?: string;
  scroll_menu_background_color?: string;
  scroll_menu_text_color?: string;
  scroll_menu_icon_color?: string;
  scroll_menu_logo_tint_enabled?: boolean;
  scroll_menu_logo_tint_color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenuVisualSettingUpdate {
  id?: string;
  key?: string;
  header_logo_url?: string;
  scroll_menu_background_color?: string;
  scroll_menu_text_color?: string;
  scroll_menu_icon_color?: string;
  scroll_menu_logo_tint_enabled?: boolean;
  scroll_menu_logo_tint_color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenuRow {
  id: string;
  name: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MenuInsert {
  id?: string;
  name: string;
  location: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MenuUpdate {
  id?: string;
  name?: string;
  location?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface OfferingGalleryItemRow {
  id: string;
  offering_id: string;
  image_id: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OfferingGalleryItemInsert {
  id?: string;
  offering_id: string;
  image_id?: string | null;
  caption?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OfferingGalleryItemUpdate {
  id?: string;
  offering_id?: string;
  image_id?: string | null;
  caption?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OfferingPriceRow {
  id: string;
  offering_id: string;
  label: string;
  price: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface OfferingPriceInsert {
  id?: string;
  offering_id: string;
  label: string;
  price: number;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OfferingPriceUpdate {
  id?: string;
  offering_id?: string;
  label?: string;
  price?: number;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OfferingScheduleRow {
  id: string;
  offering_id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferingScheduleInsert {
  id?: string;
  offering_id: string;
  day_of_week: number;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OfferingScheduleUpdate {
  id?: string;
  offering_id?: string;
  day_of_week?: number;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OfferingRow {
  id: string;
  type: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  description: string | null;
  price: number | null;
  currency: string;
  status: string;
  featured: boolean;
  duration: string | null;
  header_id: string | null;
  schedule: Json;
  teacher: string | null;
  capacity: number | null;
  cover_image_url: string | null;
  gallery: Json;
  details: Json;
  seo_title: string | null;
  seo_description: string | null;
  expiration_enabled: boolean;
  expires_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OfferingInsert {
  id?: string;
  type: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string;
  status?: string;
  featured?: boolean;
  duration?: string | null;
  header_id?: string | null;
  schedule: Json;
  teacher?: string | null;
  capacity?: number | null;
  cover_image_url?: string | null;
  gallery: Json;
  details?: Json;
  seo_title?: string | null;
  seo_description?: string | null;
  expiration_enabled?: boolean;
  expires_at?: string | null;
  expired_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface OfferingUpdate {
  id?: string;
  type?: string;
  title?: string;
  slug?: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string;
  status?: string;
  featured?: boolean;
  duration?: string | null;
  header_id?: string | null;
  schedule?: Json;
  teacher?: string | null;
  capacity?: number | null;
  cover_image_url?: string | null;
  gallery?: Json;
  details?: Json;
  seo_title?: string | null;
  seo_description?: string | null;
  expiration_enabled?: boolean;
  expires_at?: string | null;
  expired_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  quantity?: number;
  unit_price: number;
  total: number;
  created_at?: string;
}

export interface OrderItemUpdate {
  id?: string;
  order_id?: string;
  product_id?: string | null;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  created_at?: string;
}

export interface OrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: string;
  payment_status: string;
  subtotal: number | null;
  discount_total: number | null;
  shipping_total: number | null;
  total: number | null;
  coupon_code: string | null;
  shipping_method_id: string | null;
  shipping_address: string | null;
  payment_method: string | null;
  payment_id: string | null;
  internal_notes: string | null;
  notification_status: string | null;
  notification_provider: string | null;
  notification_to: string | null;
  notification_from: string | null;
  notification_message_id: string | null;
  notification_error: string | null;
  notification_attempted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrderInsert {
  id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  status?: string;
  payment_status?: string;
  subtotal?: number | null;
  discount_total?: number | null;
  shipping_total?: number | null;
  total?: number | null;
  coupon_code?: string | null;
  shipping_method_id?: string | null;
  shipping_address?: string | null;
  payment_method?: string | null;
  payment_id?: string | null;
  internal_notes?: string | null;
  notification_status?: string | null;
  notification_provider?: string | null;
  notification_to?: string | null;
  notification_from?: string | null;
  notification_message_id?: string | null;
  notification_error?: string | null;
  notification_attempted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface OrderUpdate {
  id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string | null;
  status?: string;
  payment_status?: string;
  subtotal?: number | null;
  discount_total?: number | null;
  shipping_total?: number | null;
  total?: number | null;
  coupon_code?: string | null;
  shipping_method_id?: string | null;
  shipping_address?: string | null;
  payment_method?: string | null;
  payment_id?: string | null;
  internal_notes?: string | null;
  notification_status?: string | null;
  notification_provider?: string | null;
  notification_to?: string | null;
  notification_from?: string | null;
  notification_message_id?: string | null;
  notification_error?: string | null;
  notification_attempted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PageBlockRow {
  id: string;
  page_id: string;
  type: string;
  title: string | null;
  text: string | null;
  image_id: string | null;
  source_url: string | null;
  is_visible: boolean;
  sort_order: number;
  custom_html: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageBlockInsert {
  id?: string;
  page_id: string;
  type?: string;
  title?: string | null;
  text?: string | null;
  image_id?: string | null;
  source_url?: string | null;
  is_visible?: boolean;
  sort_order?: number;
  custom_html?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PageBlockUpdate {
  id?: string;
  page_id?: string;
  type?: string;
  title?: string | null;
  text?: string | null;
  image_id?: string | null;
  source_url?: string | null;
  is_visible?: boolean;
  sort_order?: number;
  custom_html?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PageRow {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  header_id: string | null;
  social_gallery_id: string | null;
  testimonials_id: string | null;
  footer_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PageInsert {
  id?: string;
  title: string;
  slug: string;
  type?: string;
  status?: string;
  header_id?: string | null;
  social_gallery_id?: string | null;
  testimonials_id?: string | null;
  footer_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PageUpdate {
  id?: string;
  title?: string;
  slug?: string;
  type?: string;
  status?: string;
  header_id?: string | null;
  social_gallery_id?: string | null;
  testimonials_id?: string | null;
  footer_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ProductCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_id: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductCategoryInsert {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  image_id?: string | null;
  status?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ProductCategoryUpdate {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  image_id?: string | null;
  status?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  excerpt: string | null;
  main_image_id: string | null;
  gallery: Json;
  price: number | null;
  compare_at_price: number | null;
  stock: number | null;
  low_stock_threshold: number;
  category_id: string | null;
  characteristics: string | null;
  weight: string | null;
  dimensions: string | null;
  cta_label: string | null;
  cta_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductInsert {
  id?: string;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  excerpt?: string | null;
  main_image_id?: string | null;
  gallery: Json;
  price?: number | null;
  compare_at_price?: number | null;
  stock?: number | null;
  low_stock_threshold?: number;
  category_id?: string | null;
  characteristics?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ProductUpdate {
  id?: string;
  name?: string;
  slug?: string;
  sku?: string | null;
  description?: string | null;
  excerpt?: string | null;
  main_image_id?: string | null;
  gallery?: Json;
  price?: number | null;
  compare_at_price?: number | null;
  stock?: number | null;
  low_stock_threshold?: number;
  category_id?: string | null;
  characteristics?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  full_name?: string | null;
  email: string;
  role: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  id?: string;
  full_name?: string | null;
  email?: string;
  role?: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromoBannerRow {
  id: string;
  title: string;
  text: string | null;
  key_text: string | null;
  detail_text: string | null;
  image_url: string | null;
  button_text: string | null;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  visual_variant: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PromoBannerInsert {
  id?: string;
  title: string;
  text?: string | null;
  key_text?: string | null;
  detail_text?: string | null;
  image_url?: string | null;
  button_text?: string | null;
  link_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  visual_variant?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PromoBannerUpdate {
  id?: string;
  title?: string;
  text?: string | null;
  key_text?: string | null;
  detail_text?: string | null;
  image_url?: string | null;
  button_text?: string | null;
  link_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  visual_variant?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface RedirectRow {
  id: string;
  source_url: string;
  target_url: string;
  redirect_type: string;
  status: string;
  notes: string | null;
  hit_count: number;
  last_hit_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RedirectInsert {
  id?: string;
  source_url: string;
  target_url: string;
  redirect_type?: string;
  status?: string;
  notes?: string | null;
  hit_count?: number;
  last_hit_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface RedirectUpdate {
  id?: string;
  source_url?: string;
  target_url?: string;
  redirect_type?: string;
  status?: string;
  notes?: string | null;
  hit_count?: number;
  last_hit_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ReservationRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  offering_id: string;
  schedule_id: string | null;
  date: string;
  time: string | null;
  people_count: number;
  status: string;
  payment_status: string;
  payment_id: string | null;
  total_amount: number | null;
  currency: string;
  notes: string | null;
  internal_notes: string | null;
  notification_status: string | null;
  notification_provider: string | null;
  notification_to: string | null;
  notification_from: string | null;
  notification_message_id: string | null;
  notification_error: string | null;
  notification_attempted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ReservationInsert {
  id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  offering_id: string;
  schedule_id?: string | null;
  date: string;
  time?: string | null;
  people_count?: number;
  status?: string;
  payment_status?: string;
  payment_id?: string | null;
  total_amount?: number | null;
  currency?: string;
  notes?: string | null;
  internal_notes?: string | null;
  notification_status?: string | null;
  notification_provider?: string | null;
  notification_to?: string | null;
  notification_from?: string | null;
  notification_message_id?: string | null;
  notification_error?: string | null;
  notification_attempted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ReservationUpdate {
  id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string | null;
  offering_id?: string;
  schedule_id?: string | null;
  date?: string;
  time?: string | null;
  people_count?: number;
  status?: string;
  payment_status?: string;
  payment_id?: string | null;
  total_amount?: number | null;
  currency?: string;
  notes?: string | null;
  internal_notes?: string | null;
  notification_status?: string | null;
  notification_provider?: string | null;
  notification_to?: string | null;
  notification_from?: string | null;
  notification_message_id?: string | null;
  notification_error?: string | null;
  notification_attempted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ShippingMethodRow {
  id: string;
  name: string;
  type: string;
  price: number | null;
  countries: Json;
  description: string | null;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ShippingMethodInsert {
  id?: string;
  name: string;
  type?: string;
  price?: number | null;
  countries: Json;
  description?: string | null;
  sort_order?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ShippingMethodUpdate {
  id?: string;
  name?: string;
  type?: string;
  price?: number | null;
  countries?: Json;
  description?: string | null;
  sort_order?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SiteSettingRow {
  id: string;
  site_name: string;
  site_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  header_logo_url: string | null;
  scroll_menu_background_color: string;
  scroll_menu_text_color: string;
  scroll_menu_icon_color: string;
  scroll_menu_logo_tint_enabled: boolean;
  scroll_menu_logo_tint_color: string;
  default_language: string;
  timezone: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string;
  country: string;
  map_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  pinterest_url: string | null;
  footer_logo_url: string | null;
  footer_text: string | null;
  legal_text: string | null;
  show_social_links: boolean;
  show_contact_info: boolean;
  maintenance_mode: boolean;
  created_at: string;
  updated_at: string;
  default_seo_title: string | null;
  default_seo_description: string | null;
  default_og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
}

export interface SiteSettingInsert {
  id?: string;
  site_name: string;
  site_description?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  header_logo_url?: string | null;
  scroll_menu_background_color?: string;
  scroll_menu_text_color?: string;
  scroll_menu_icon_color?: string;
  scroll_menu_logo_tint_enabled?: boolean;
  scroll_menu_logo_tint_color?: string;
  default_language?: string;
  timezone?: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string;
  country?: string;
  map_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  pinterest_url?: string | null;
  footer_logo_url?: string | null;
  footer_text?: string | null;
  legal_text?: string | null;
  show_social_links?: boolean;
  show_contact_info?: boolean;
  maintenance_mode?: boolean;
  created_at?: string;
  updated_at?: string;
  default_seo_title?: string | null;
  default_seo_description?: string | null;
  default_og_image_url?: string | null;
  robots_index?: boolean;
  robots_follow?: boolean;
}

export interface SiteSettingUpdate {
  id?: string;
  site_name?: string;
  site_description?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  header_logo_url?: string | null;
  scroll_menu_background_color?: string;
  scroll_menu_text_color?: string;
  scroll_menu_icon_color?: string;
  scroll_menu_logo_tint_enabled?: boolean;
  scroll_menu_logo_tint_color?: string;
  default_language?: string;
  timezone?: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string;
  country?: string;
  map_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  pinterest_url?: string | null;
  footer_logo_url?: string | null;
  footer_text?: string | null;
  legal_text?: string | null;
  show_social_links?: boolean;
  show_contact_info?: boolean;
  maintenance_mode?: boolean;
  created_at?: string;
  updated_at?: string;
  default_seo_title?: string | null;
  default_seo_description?: string | null;
  default_og_image_url?: string | null;
  robots_index?: boolean;
  robots_follow?: boolean;
}

export interface SocialGalleryRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  title: string | null;
  description: string | null;
  cta_text: string | null;
  cta_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SocialGalleryInsert {
  id?: string;
  name: string;
  slug: string;
  status?: string;
  title?: string | null;
  description?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SocialGalleryUpdate {
  id?: string;
  name?: string;
  slug?: string;
  status?: string;
  title?: string | null;
  description?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SocialGalleryItemRow {
  id: string;
  social_gallery_id: string;
  image_id: string | null;
  url: string | null;
  platform: string | null;
  title: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  description: string | null;
  is_visible: boolean;
}

export interface SocialGalleryItemInsert {
  id?: string;
  social_gallery_id: string;
  image_id?: string | null;
  url?: string | null;
  platform?: string | null;
  title?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  image_url?: string | null;
  description?: string | null;
  is_visible?: boolean;
}

export interface SocialGalleryItemUpdate {
  id?: string;
  social_gallery_id?: string;
  image_id?: string | null;
  url?: string | null;
  platform?: string | null;
  title?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  image_url?: string | null;
  description?: string | null;
  is_visible?: boolean;
}

export interface TeacherRow {
  id: string;
  name: string;
  bio: string | null;
  image_id: string | null;
  instagram: string | null;
  specialty: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TeacherInsert {
  id?: string;
  name: string;
  bio?: string | null;
  image_id?: string | null;
  instagram?: string | null;
  specialty?: string | null;
  status?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TeacherUpdate {
  id?: string;
  name?: string;
  bio?: string | null;
  image_id?: string | null;
  instagram?: string | null;
  specialty?: string | null;
  status?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TestimonialRow {
  id: string;
  name: string;
  role: string | null;
  text: string | null;
  avatar_id: string | null;
  status: string;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TestimonialInsert {
  id?: string;
  name: string;
  role?: string | null;
  text?: string | null;
  avatar_id?: string | null;
  status?: string;
  sort_order?: number;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TestimonialUpdate {
  id?: string;
  name?: string;
  role?: string | null;
  text?: string | null;
  avatar_id?: string | null;
  status?: string;
  sort_order?: number;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TrashItemRow {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  deleted_by: string | null;
  deleted_at: string;
  restore_data: Json | null;
}

export interface TrashItemInsert {
  id?: string;
  entity_type: string;
  entity_id: string;
  title: string;
  deleted_by?: string | null;
  deleted_at?: string;
  restore_data?: Json | null;
}

export interface TrashItemUpdate {
  id?: string;
  entity_type?: string;
  entity_id?: string;
  title?: string;
  deleted_by?: string | null;
  deleted_at?: string;
  restore_data?: Json | null;
}
