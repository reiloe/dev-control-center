import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ExternalLink,
  Play,
  RefreshCw,
  Search,
  Server,
  Square,
  Terminal,
  Camera,
  History,
} from 'lucide-react';
import { controlService, fetchServices, triggerSnapshot, type ServiceStatus } from './api/servicesApi';
import { LogModal } from './components/LogModal';
import { AuditDrawer } from './components/AuditDrawer';

export function App() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('ALL');
  const [busyContainer, setBusyContainer] = useState<string | null>(null);
  const [activeLogService, setActiveLogService] = useState<ServiceStatus | null>(null);

  const [showAudit, setShowAudit] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSnapshot = async () => {
    setSnapshotting(true);
    setToastMessage(null);
    try {
      const res = await triggerSnapshot();
      setToastMessage(
          `Saved ${res.objectKey} to SeaweedFS S3 (${res.bucket}) & notified via Mailpit!`
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Snapshot failed');
    } finally {
      setSnapshotting(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchServices();
      setServices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const sync = () => {
      fetchServices()
          .then((data) => {
            if (active) {
              setServices(data);
              setError(null);
            }
          })
          .catch((err) => {
            if (active) {
              setError(err instanceof Error ? err.message : 'Backend unreachable');
            }
          })
          .finally(() => {
            if (active) {
              setLoading(false);
            }
          });
    };

    sync();
    const interval = setInterval(sync, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);


  const profiles = useMemo(() => {
    const unique = Array.from(new Set(services.map((s) => s.profile)));
    return ['ALL', ...unique];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesProfile = selectedProfile === 'ALL' || s.profile === selectedProfile;
      const matchesSearch =
          s.serviceName.toLowerCase().includes(search.toLowerCase()) ||
          s.containerName.toLowerCase().includes(search.toLowerCase()) ||
          s.profile.toLowerCase().includes(search.toLowerCase());
      return matchesProfile && matchesSearch;
    });
  }, [services, selectedProfile, search]);

  const runningCount = services.filter((s) => s.state === 'RUNNING').length;

  const handleAction = async (containerName: string, action: 'start' | 'stop') => {
    setBusyContainer(containerName);
    try {
      await controlService(containerName, action);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyContainer(null);
    }
  };

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Top Navbar */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">
                  DevOps Control Center
                </h1>
                <p className="text-xs text-slate-400">
                  Local Multi-Arch Infrastructure Manager
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-slate-800/90 px-4 py-1.5 text-xs font-medium">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>
                <strong className="text-emerald-400">{runningCount}</strong> / {services.length}{' '}
                  Running
              </span>
              </div>
              <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Sync
              </button>
              <button
                  onClick={handleSnapshot}
                  disabled={snapshotting}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {snapshotting ? 'Exporting...' : 'Snapshot (S3)'}
              </button>

              <button
                  onClick={() => setShowAudit(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              >
                <History className="h-3.5 w-3.5" />
                Audit Log
              </button>

            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          {error && (
              <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200">
                <strong>Connection Warning:</strong> {error}. Make sure the Spring Boot backend is
                running on port 8080.
              </div>
          )}

          {/* Filter & Search Bar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                  type="text"
                  placeholder="Search service, container, profile..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pr-4 pl-9 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {profiles.map((profile) => (
                  <button
                      key={profile}
                      onClick={() => setSelectedProfile(profile)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          selectedProfile === profile
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    {profile}
                  </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const isRunning = service.state === 'RUNNING';
              const isNotCreated = service.state === 'NOT_CREATED';
              const isBusy = busyContainer === service.containerName;

              return (
                  <div
                      key={service.containerName}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700"
                  >
                    <div>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                      <span className="inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                        {service.profile}
                      </span>
                          <h2 className="mt-1.5 text-base font-semibold text-white">
                            {service.serviceName}
                          </h2>
                          <p className="font-mono text-xs text-slate-400">{service.containerName}</p>
                        </div>

                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                isRunning
                                    ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                                    : isNotCreated
                                        ? 'bg-slate-800 text-slate-400'
                                        : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'
                            }`}
                        >
                      <span
                          className={`h-1.5 w-1.5 rounded-full ${
                              isRunning
                                  ? 'bg-emerald-400'
                                  : isNotCreated
                                      ? 'bg-slate-500'
                                      : 'bg-amber-400'
                          }`}
                      />
                          {service.state}
                    </span>
                      </div>

                      <p className="mb-4 text-xs text-slate-400">{service.statusText}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                      <div className="flex items-center gap-2">
                        {!isRunning ? (
                            <button
                                disabled={isNotCreated || isBusy}
                                onClick={() => handleAction(service.containerName, 'start')}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Start
                            </button>
                        ) : (
                            <button
                                disabled={isBusy}
                                onClick={() => handleAction(service.containerName, 'stop')}
                                className="flex items-center gap-1 rounded-lg bg-rose-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500 disabled:opacity-40"
                            >
                              <Square className="h-3.5 w-3.5" />
                              Stop
                            </button>
                        )}

                        <button
                            disabled={isNotCreated}
                            onClick={() => setActiveLogService(service)}
                            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          Logs
                        </button>
                      </div>

                      {service.webUiUrl && isRunning && (
                          <a
                              href={service.webUiUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                          >
                            Open UI
                            <ExternalLink className="h-3.5 w-3.5" />
                          </ a>
                      )}
                    </div>
                  </div>
              );
            })}
          </div>
        </main>

        {activeLogService && (
            <LogModal
                containerName={activeLogService.containerName}
                serviceName={activeLogService.serviceName}
                onClose={() => setActiveLogService(null)}
            />
        )}
        {toastMessage && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-4 py-3 text-xs text-cyan-200">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-cyan-400 hover:underline">
                Dismiss
              </button>
            </div>
        )}

        {showAudit && <AuditDrawer onClose={() => setShowAudit(false)} />}

      </div>
  );
}

export default App;