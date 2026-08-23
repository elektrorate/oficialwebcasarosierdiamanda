"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CmsAdminUser } from "@/lib/admin/users";
import { formatAdminDateTime } from "@/lib/admin/date-format";
import { USER_ROLES, type AdminRole } from "@/lib/auth/roles";

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Administrador",
  editor: "Editor",
  teacher: "Profesor",
  collaborator: "Colaborador",
};

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  admin: "Acceso completo, incluida la gestión de usuarios.",
  editor: "Acceso al CMS y gestión de contenidos, sin administrar usuarios.",
  teacher: "Perfil preparado para acceso limitado de profesor.",
  collaborator: "Perfil preparado para acceso limitado de colaborador.",
};

export default function UsersManager({ initialUsers }: { initialUsers: CmsAdminUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CmsAdminUser | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users
      .filter((user) => {
        if (!normalizedQuery) return true;
        return `${user.full_name} ${user.email}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => {
        const diff = Date.parse(b.created_at) - Date.parse(a.created_at);
        return sort === "newest" ? diff : -diff;
      });
  }, [query, sort, users]);

  const reloadUsers = useCallback(async () => {
    const response = await fetch("/api/admin/users");
    if (!response.ok) return;
    const data = (await response.json()) as { users: CmsAdminUser[] };
    setUsers(data.users);
    router.refresh();
  }, [router]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reloadUsers();
    }, 0);
    return () => window.clearTimeout(id);
  }, [reloadUsers]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsLoading(true);
    setStatus(null);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: formData.get("full_name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsLoading(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "No se pudo crear el usuario." });
      return;
    }

    form.reset();
    setCreateOpen(false);
    setStatus({ type: "success", text: "Usuario creado correctamente." });
    await reloadUsers();
  }

  async function updateRole(user: CmsAdminUser, role: AdminRole) {
    if (role === user.role) return;
    const confirmed = window.confirm(`¿Cambiar el rol de ${user.email} a ${ROLE_LABELS[role]}?`);
    if (!confirmed) return;

    setIsLoading(true);
    setStatus(null);
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsLoading(false);
    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "No se pudo actualizar el rol." });
      return;
    }
    setStatus({ type: "success", text: "Rol actualizado correctamente." });
    await reloadUsers();
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsLoading(true);
    setStatus(null);

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: formData.get("password") }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsLoading(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "No se pudo actualizar la contraseña." });
      return;
    }

    form.reset();
    setEditingUser(null);
    setStatus({ type: "success", text: "Contraseña actualizada." });
  }

  async function deleteUser(user: CmsAdminUser) {
    const confirmed = window.confirm(`¿Eliminar el acceso de ${user.email}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setIsLoading(true);
    setStatus(null);

    const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsLoading(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "No se pudo eliminar el usuario." });
      return;
    }

    setStatus({ type: "success", text: "Usuario eliminado." });
    await reloadUsers();
  }

  return (
    <div className="users-admin">
      {status ? <p className={`form-alert form-alert--${status.type}`} role="status">{status.text}</p> : null}

      <div className="admin-control-bar">
        <label className="field admin-control-bar__search">
          <span>Buscar usuario</span>
          <input
            type="search"
            placeholder="Nombre o correo"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="field admin-control-bar__select">
          <span>Orden</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as "newest" | "oldest")}>
            <option value="newest">Más recientes primero</option>
            <option value="oldest">Menos recientes primero</option>
          </select>
        </label>
      </div>

      {createOpen ? (
        <form className="editor-form form-block users-admin__form" onSubmit={handleCreate}>
          <div className="menu-editor-head">
            <h3>Crear usuario</h3>
            <button type="button" className="secondary-btn" onClick={() => setCreateOpen(false)}>
              Cancelar
            </button>
          </div>
          <div className="grid-2">
            <label className="field">
              <span>Nombre</span>
              <input name="full_name" type="text" placeholder="Ej. Coordinacion Casa Rosier" />
            </label>
            <label className="field">
              <span>Email *</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="field span-2">
              <span>Contraseña inicial *</span>
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
              <small>Usa al menos 8 caracteres.</small>
            </label>
            <label className="field span-2">
              <span>Rol *</span>
              <select name="role" defaultValue="editor" required>
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
              <small>El administrador tiene control completo. Los accesos limitados se aplican según el rol.</small>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="primary-btn users-admin__create" onClick={() => setCreateOpen(true)}>
          <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
          Crear usuario
        </button>
      )}

      {editingUser ? (
        <form className="editor-form form-block users-admin__form" onSubmit={handlePasswordUpdate}>
          <div className="menu-editor-head">
            <h3>Cambiar contraseña</h3>
            <button type="button" className="secondary-btn" onClick={() => setEditingUser(null)}>
              Cancelar
            </button>
          </div>
          <p className="muted">Nuevo acceso para {editingUser.email}.</p>
          <label className="field">
            <span>Nueva contraseña *</span>
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            <small>El usuario podrá iniciar sesión con esta contraseña inmediatamente.</small>
          </label>
          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Creado</th>
              <th>Último acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.full_name || user.email}</strong>
                  <br />
                  <span className="muted">{user.email}</span>
                </td>
                <td>
                  <label className="field">
                    <span className="sr-only">Rol de {user.email}</span>
                    <select
                      value={user.role}
                      disabled={isLoading}
                      title={ROLE_DESCRIPTIONS[user.role]}
                      onChange={(event) => void updateRole(user, event.target.value as AdminRole)}
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                      ))}
                    </select>
                  </label>
                </td>
                <td>{formatAdminDateTime(user.created_at)}</td>
                <td>{formatAdminDateTime(user.last_sign_in_at, "Sin ingreso")}</td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="secondary-btn" onClick={() => setEditingUser(user)}>
                      Contraseña
                    </button>
                    <button type="button" className="danger-btn" onClick={() => deleteUser(user)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <p className="muted users-admin__empty">No hay usuarios visibles para esta búsqueda.</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
