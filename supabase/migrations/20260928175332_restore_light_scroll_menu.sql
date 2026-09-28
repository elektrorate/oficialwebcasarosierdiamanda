-- Restore the original light scroll navigation and retire the legacy brown
-- value from both persisted settings sources.

alter table public.site_settings
  alter column scroll_menu_background_color set default '#f9f8f3',
  alter column scroll_menu_text_color set default '#3f3933',
  alter column scroll_menu_icon_color set default '#3f3933',
  alter column scroll_menu_logo_tint_color set default '#3f3933';

update public.site_settings
set
  scroll_menu_background_color = '#f9f8f3',
  scroll_menu_text_color = case
    when lower(trim(scroll_menu_text_color)) in ('#fff', '#ffffff', '#fff9f1') then '#3f3933'
    else scroll_menu_text_color
  end,
  scroll_menu_icon_color = case
    when lower(trim(scroll_menu_icon_color)) in ('#fff', '#ffffff', '#fff9f1') then '#3f3933'
    else scroll_menu_icon_color
  end,
  scroll_menu_logo_tint_color = case
    when lower(trim(scroll_menu_logo_tint_color)) in ('#fff', '#ffffff', '#fff9f1') then '#3f3933'
    else scroll_menu_logo_tint_color
  end
where lower(trim(scroll_menu_background_color)) = '#8c7457';

alter table public.menu_visual_settings
  alter column scroll_menu_background_color set default '#f9f8f3',
  alter column scroll_menu_text_color set default '#3f3933',
  alter column scroll_menu_icon_color set default '#3f3933',
  alter column scroll_menu_logo_tint_color set default '#3f3933';

update public.menu_visual_settings
set
  scroll_menu_background_color = '#f9f8f3',
  scroll_menu_text_color = case
    when lower(trim(scroll_menu_text_color)) in ('#fff', '#ffffff', '#fff9f1') then '#3f3933'
    else scroll_menu_text_color
  end,
  scroll_menu_icon_color = case
    when lower(trim(scroll_menu_icon_color)) in ('#fff', '#ffffff', '#fff9f1') then '#3f3933'
    else scroll_menu_icon_color
  end,
  scroll_menu_logo_tint_color = case
    when lower(trim(scroll_menu_logo_tint_color)) in ('#fff', '#ffffff', '#fff9f1') then '#3f3933'
    else scroll_menu_logo_tint_color
  end
where lower(trim(scroll_menu_background_color)) = '#8c7457';
