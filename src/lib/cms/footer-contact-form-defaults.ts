import type { Form, FormField } from "./types";

export const FOOTER_CONTACT_FORM_SLUG = "footer-contact";

export const DEFAULT_FOOTER_CONTACT_FIELDS: FormField[] = [
  {
    id: "footer-field-name",
    label: "Nombre",
    name: "name",
    type: "text",
    placeholder: "Nombre",
    required: true,
    options: [],
    default_value: "",
    sort_order: 0,
    is_visible: true,
  },
  {
    id: "footer-field-email",
    label: "Correo electronico",
    name: "email",
    type: "email",
    placeholder: "Correo electronico *",
    required: true,
    options: [],
    default_value: "",
    sort_order: 1,
    is_visible: true,
  },
  {
    id: "footer-field-phone",
    label: "Numero de telefono",
    name: "phone",
    type: "phone",
    placeholder: "Numero de telefono",
    required: false,
    options: [],
    default_value: "",
    sort_order: 2,
    is_visible: true,
  },
  {
    id: "footer-field-message",
    label: "Comentario",
    name: "message",
    type: "textarea",
    placeholder: "Comentario",
    required: true,
    options: [],
    default_value: "",
    sort_order: 3,
    is_visible: true,
  },
];

/** Client hook stub when the footer editor runs without CMS form data. */
export const FOOTER_CONTACT_FORM_EDITOR_STUB: Form = {
  id: "__footer_contact_stub__",
  name: "Contacto footer",
  slug: FOOTER_CONTACT_FORM_SLUG,
  type: "contact",
  status: "active",
  title: "",
  description: "",
  success_message: "",
  redirect_url: "",
  email_notification_enabled: false,
  notification_email: "",
  fields: [],
  created_at: "",
  updated_at: "",
  deleted_at: null,
};
