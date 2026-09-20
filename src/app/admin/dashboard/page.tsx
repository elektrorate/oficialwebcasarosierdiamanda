import { redirect } from "next/navigation";
import Link from "@/components/admin/AdminLink";
import AdminShell from "@/components/admin/AdminShell";
import TopBar from "@/components/layout/TopBar";
import MetricCard from "@/components/ui/MetricCard";
import Card from "@/components/ui/Card";
import { getDashboardMetrics } from "@/lib/cms/dashboard-metrics";
import { getRecentHistoryLogs } from "@/lib/cms/history-logs";
import { requireAdminProfile } from "@/lib/auth/supabase-auth";
import { formatAdminDateTime } from "@/lib/admin/date-format";

const activityLabels: Record<string, string> = {
  create: "Creación",
  update: "Actualización",
  publish: "Publicación",
  unpublish: "Cambio a borrador",
  archive: "Archivo",
  trash: "Papelera",
  restore: "Restauración",
  delete_permanently: "Eliminación",
  duplicate: "Duplicado",
};

export default async function DashboardPage() {
  const session = await requireAdminProfile();
  if (!session) redirect("/auth");

  const [metrics, historyLogs] = await Promise.all([
    getDashboardMetrics(),
    getRecentHistoryLogs(5),
  ]);

  const recentActivity = historyLogs;

  return (
    <AdminShell>
      <TopBar
        title="Dashboard"
        subtitle="Bienvenido al panel de administración de Casa Rosier"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-section-gap">
        <MetricCard
          icon="web"
          iconBg="bg-surface-container-high"
          iconClassName="text-primary"
          value={metrics.activePages}
          label="Páginas"
          footer={
            <>
              <span className="material-symbols-outlined text-xs mr-1">public</span>
              {metrics.publishedPages} publicadas
            </>
          }
        />
        <MetricCard
          icon="school"
          iconBg="bg-primary-container"
          value={metrics.activeClasses}
          label="Clases"
          footer={
            <>
              <span className="material-symbols-outlined text-xs mr-1">check_circle</span>
              {metrics.publishedClasses} visibles
            </>
          }
        />
        <MetricCard
          icon="description"
          iconBg="bg-tertiary-container"
          value={metrics.activeWorkshops}
          label="Workshops"
          footer={
            <>
              <span className="material-symbols-outlined text-xs mr-1">check_circle</span>
              {metrics.publishedWorkshops} visibles
            </>
          }
        />
        <MetricCard
          icon="mail"
          iconBg="bg-secondary-container"
          value={metrics.activeMessages}
          label="Mensajes"
          footer={
            <>
              <span className="material-symbols-outlined text-xs mr-1">mark_email_unread</span>
              {metrics.unreadMessages} nuevos
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card padding="none">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
              ACTIVIDAD RECIENTE
            </h2>
            <Link href="/admin/history-logs" className="text-primary text-sm font-semibold hover:underline">
              Ver todo
            </Link>
          </div>
          {recentActivity.length ? (
            <div className="divide-y divide-outline-variant">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-surface-container-low transition-colors flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-primary">
                      history
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-on-surface truncate">{item.entity_title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant mt-0.5">
                      <span>{activityLabels[item.action] ?? item.action}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatAdminDateTime(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-on-surface-variant">
              No hay actividad reciente registrada todavía.
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
