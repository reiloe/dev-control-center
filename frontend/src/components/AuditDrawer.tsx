import { useEffect, useState } from 'react';
import { History, X, Clock, User } from 'lucide-react';
import { fetchAuditEvents, type AuditEvent } from '../api/servicesApi';

interface AuditDrawerProps {
    onClose: () => void;
}

export function AuditDrawer({ onClose }: AuditDrawerProps) {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        fetchAuditEvents()
            .then((data) => {
                if (active) {
                    setEvents(data);
                    setError(null);
                }
            })
            .catch((err) => {
                if (active) {
                    setError(err instanceof Error ? err.message : 'Could not load audit log');
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <div className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <History className="h-5 w-5 text-cyan-400" />
                        <h3 className="font-semibold text-white">PostgreSQL Audit Log</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <p className="text-sm text-slate-400">Loading audit events...</p>
                    ) : error ? (
                        <p className="rounded-lg bg-rose-950/50 p-3 text-xs text-rose-300">{error}</p>
                    ) : events.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No container actions recorded yet. Start or stop a service to test PostgreSQL persistence.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {events.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs"
                                >
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="font-mono font-semibold text-white">{ev.containerName}</span>
                                        <span
                                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                                ev.action === 'START'
                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                    : 'bg-rose-500/15 text-rose-400'
                                            }`}
                                        >
                      {ev.action}
                    </span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {ev.actor}
                    </span>
                                        <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(ev.occurredAt).toLocaleString()}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
