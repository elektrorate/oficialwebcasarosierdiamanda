-- Cover foreign-key columns used by FAQ and marketing relations.
-- These indexes reduce lock amplification and avoid full-table scans when
-- referenced rows are updated or deleted.
create index if not exists blog_page_settings_faq_group_id_idx
  on public.blog_page_settings (faq_group_id);

create index if not exists faqs_faq_group_id_idx
  on public.faqs (faq_group_id);

create index if not exists marketing_conversions_campaign_id_idx
  on public.marketing_conversions (campaign_id);

create index if not exists marketing_event_logs_campaign_id_idx
  on public.marketing_event_logs (campaign_id);

create index if not exists marketing_event_logs_event_id_idx
  on public.marketing_event_logs (event_id);

create index if not exists studio_page_settings_faq_group_id_idx
  on public.studio_page_settings (faq_group_id);
