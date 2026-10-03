"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CmsRichTextField } from "@/components/admin/CmsRichTextField";

interface PrivacyPolicySettings {
  privacy_policy_title?: string;
  privacy_policy_content?: string;
}

export default function LegalForm() {
  const router = useRouter();
  const [title, setTitle] = useState("Políticas de privacidad");
  const [content, setContent] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/legal-cookies");
        if (!response.ok) throw new Error("No se pudo cargar la política.");
        const settings = (await response.json()) as PrivacyPolicySettings;
        if (!isMounted) return;
        setTitle(settings.privacy_policy_title || "Políticas de privacidad");
        setContent(settings.privacy_policy_content?.trim() || "");
      } catch {
        if (isMounted) {
          setError("No se pudo cargar la política. Revisa tu sesión e intenta de nuevo.");
        }
      } finally {
        if (isMounted) setIsReady(true);
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/admin/legal-cookies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        privacy_policy_title: title.trim() || "Políticas de privacidad",
        privacy_policy_content: content.trim(),
      }),
    });

    if (response.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } else {
      setError("No se pudo guardar la política. Intenta de nuevo.");
    }

    setIsLoading(false);
  }

  if (!isReady) return <p className="muted">Cargando...</p>;

  return (
    <form className="editor-form privacy-editor-form" onSubmit={save}>
      <section className="form-block">
        <div className="grid-2">
          <label className="field span-2">
            <span>Título de la página</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Políticas de privacidad"
            />
          </label>
          <div className="span-2">
            <CmsRichTextField
              label="Contenido Markdown"
              value={content}
              onChange={setContent}
              minHeight="460px"
              placeholder="Escribe la política de privacidad..."
            />
          </div>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="primary-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : saved ? "Guardado" : "Guardar política"}
        </button>
      </div>
    </form>
  );
}
