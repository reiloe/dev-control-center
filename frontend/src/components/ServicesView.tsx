import { useMemo, useState } from 'react';
import type { ServiceStatus } from '../api/servicesApi';
import { ServiceFilterBar } from './ServiceFilterBar';
import type { StatusFilter, ViewMode } from './ServiceFilterBar';

interface ServicesViewProps {
    services: ServiceStatus[];
    isAdmin: boolean;
    busyContainer: string | null;
    onToggleService: (service: ServiceStatus) => void;
    onOpenLogs: (service: ServiceStatus) => void;
}

export function ServicesView({
                                 services,
                                 isAdmin,
                                 busyContainer,
                                 onToggleService,
                                 onOpenLogs,
                             }: ServicesViewProps) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [profileFilter, setProfileFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [viewMode, setViewMode] = useState<ViewMode>('TABLE');

    const runningCount = useMemo(
        () => services.filter((s) => s.state === 'RUNNING').length,
        [services]
    );

    const profiles = useMemo(
        () => ['ALL', ...Array.from(new Set(services.map((s) => s.profile)))],
        [services]
    );

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return services.filter((s) => {
            const running = s.state === 'RUNNING';
            if (statusFilter === 'RUNNING' && !running) return false;
            if (statusFilter === 'STOPPED' && running) return false;
            if (profileFilter !== 'ALL' && s.profile !== profileFilter) return false;
            if (!q) return true;
            return (
                s.serviceName.toLowerCase().includes(q) ||
                s.containerName.toLowerCase().includes(q) ||
                s.profile.toLowerCase().includes(q)
            );
        });
    }, [services, statusFilter, profileFilter, searchQuery]);

    return (
        <>
            <ServiceFilterBar
                totalCount={services.length}
                runningCount={runningCount}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                profiles={profiles}
                profileFilter={profileFilter}
                onProfileFilterChange={setProfileFilter}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {viewMode === 'TABLE' ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Service</th>
                            <th className="px-4 py-3">Profil</th>
                            <th className="px-4 py-3">Container</th>
                            <th className="px-4 py-3 text-right">Aktionen</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                        {filtered.map((s) => {
                            const running = s.state === 'RUNNING';
                            const busy = busyContainer === s.containerName;
                            return (
                                <tr key={s.containerName} className="hover:bg-slate-800/40">
                                    <td className="px-4 py-2.5">
                      <span
                          title={s.statusText}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              running
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-slate-800 text-slate-400'
                          }`}
                      >
                        {s.state}
                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-medium text-slate-100">{s.serviceName}</td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{s.profile}</td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{s.containerName}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            {s.webUiUrl && running && (
                                                <a
                                                    href={s.webUiUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-md bg-sky-600/20 px-2.5 py-1 text-xs font-medium text-sky-300"
                                                >
                                                    Open UI ↗
                                                </a>
                                            )}
                                            {s.state !== 'NOT_CREATED' && (
                                                <button
                                                    onClick={() => onOpenLogs(s)}
                                                    className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                >
                                                    Logs
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => onToggleService(s)}
                                                    disabled={busy}
                                                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                                        running
                                                            ? 'bg-rose-500/15 text-rose-300'
                                                            : 'bg-emerald-500/15 text-emerald-300'
                                                    }`}
                                                >
                                                    {busy ? '...' : running ? 'Stop' : 'Start'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((s) => {
                        const running = s.state === 'RUNNING';
                        const busy = busyContainer === s.containerName;
                        return (
                            <div
                                key={s.containerName}
                                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                            >
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-slate-300">
                      {s.profile}
                    </span>
                                        <span className={running ? 'text-emerald-400' : 'text-slate-400'}>
                      {s.state}
                    </span>
                                    </div>
                                    <h3 className="font-semibold text-white">{s.serviceName}</h3>
                                    <p className="font-mono text-xs text-slate-400">{s.containerName}</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                                    <div className="flex items-center gap-2">
                                        {s.webUiUrl && running && (
                                            <a
                                                href={s.webUiUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-md bg-sky-600/20 px-2.5 py-1 text-xs text-sky-300"
                                            >
                                                Open UI ↗
                                            </a>
                                        )}
                                        {s.state !== 'NOT_CREATED' && (
                                            <button
                                                onClick={() => onOpenLogs(s)}
                                                className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                            >
                                                Logs
                                            </button>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() => onToggleService(s)}
                                            disabled={busy}
                                            className={`rounded-md px-3 py-1 text-xs font-medium ${
                                                running
                                                    ? 'bg-rose-500/15 text-rose-300'
                                                    : 'bg-emerald-500/15 text-emerald-300'
                                            }`}
                                        >
                                            {busy ? '...' : running ? 'Stop' : 'Start'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
