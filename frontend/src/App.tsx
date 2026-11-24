import { useCallback, useEffect, useState } from 'react';
import type { ServiceStatus, AuditEvent, SnapshotResult } from './api/servicesApi';
import {
  fetchServices,
  controlService,
  fetchAuditEvents,
  triggerSnapshot,
} from './api/servicesApi';
import { keycloak } from './auth/keycloak';
import { ServicesView } from './components/ServicesView';
import { AuditLogView } from './components/AuditLogView';
import { SnapshotsView } from './components/SnapshotsView';
import { LogModal } from './components/LogModal';

type ActiveTab = 'SERVICES' | 'AUDIT' | 'SNAPSHOTS';

export function App() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [lastSnapshot, setLastSnapshot] = useState<SnapshotResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('SERVICES');
  const [loading, setLoading] = useState(true);
  const [busyContainer, setBusyContainer] = useState<string | null>(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [logTarget, setLogTarget] = useState<ServiceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const username = (keycloak.tokenParsed?.preferred_username as string) ?? 'developer';
  const roles = (keycloak.tokenParsed?.realm_access?.roles as string[]) ?? [];
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');

  const refreshData = useCallback(async () => {
    try {
      const [svc, aud] = await Promise.all([fetchServices(), fetchAuditEvents()]);
      setServices(svc);
      setAuditEvents(aud);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([fetchServices(), fetchAuditEvents()])
        .then(([svc, aud]) => {
          if (active) {
            setServices(svc);
            setAuditEvents(aud);
            setError(null);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : 'Fehler beim Laden');
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

    const id = setInterval(() => {
      void refreshData();
    }, 10000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [refreshData]);

  const handleToggle = async (service: ServiceStatus) => {
    setBusyContainer(service.containerName);
    try {
      await controlService(service.containerName, service.state === 'RUNNING' ? 'stop' : 'start');
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen');
    } finally {
      setBusyContainer(null);
    }
  };

  const handleSnapshot = async () => {
    setCreatingSnapshot(true);
    try {
      const result = await triggerSnapshot();
      setLastSnapshot(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Snapshot fehlgeschlagen');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-900/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold text-white">DevOps Control Center</h1>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">{username}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-sky-300">
              {isAdmin ? 'ADMIN' : 'VIEWER'}
            </span>
              <button
                  onClick={() => void keycloak.logout()}
                  className="rounded bg-slate-800 px-3 py-1.5 text-slate-300 hover:text-rose-300"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="mx-auto flex max-w-7xl gap-6 px-6 text-sm">
            {(['SERVICES', 'AUDIT', 'SNAPSHOTS'] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 pb-3 font-medium ${
                        activeTab === tab
                            ? 'border-sky-500 text-sky-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {tab === 'SERVICES'
                      ? `Services (${services.length})`
                      : tab === 'AUDIT'
                          ? `Audit-Log (${auditEvents.length})`
                          : 'S3 Snapshot'}
                </button>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-6">
          {error && (
              <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
                {error}
              </div>
          )}
          {loading ? (
              <p className="py-12 text-center text-sm text-slate-400">Lade Daten...</p>
          ) : activeTab === 'SERVICES' ? (
              <ServicesView
                  services={services}
                  isAdmin={isAdmin}
                  busyContainer={busyContainer}
                  onToggleService={(s) => void handleToggle(s)}
                  onOpenLogs={(service) => setLogTarget(service)}
              />
          ) : activeTab === 'AUDIT' ? (
              <AuditLogView events={auditEvents} />
          ) : (
              <SnapshotsView
                  lastSnapshot={lastSnapshot}
                  isAdmin={isAdmin}
                  creating={creatingSnapshot}
                  onTriggerSnapshot={() => void handleSnapshot()}
              />
          )}
        </main>

        {logTarget && (
            <LogModal
                containerName={logTarget.containerName}
                serviceName={logTarget.serviceName}
                onClose={() => setLogTarget(null)}
            />
        )}
      </div>
  );
}

export default App;
