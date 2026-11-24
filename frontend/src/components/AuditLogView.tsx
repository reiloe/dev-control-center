import type { AuditEvent } from '../api/servicesApi';

interface AuditLogViewProps {
    events: AuditEvent[];
}

export function AuditLogView({ events }: AuditLogViewProps) {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                <tr>
                    <th className="px-4 py-3">Zeitpunkt</th>
                    <th className="px-4 py-3">Benutzer</th>
                    <th className="px-4 py-3">Aktion</th>
                    <th className="px-4 py-3">Container</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                {events.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                            Noch keine Audit-Einträge vorhanden.
                        </td>
                    </tr>
                ) : (
                    events.map((event) => (
                        <tr key={event.id} className="hover:bg-slate-800/40">
                            <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                                {new Date(event.occurredAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-slate-200">{event.actor}</td>
                            <td className="px-4 py-2.5">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-sky-300">
                    {event.action}
                  </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-slate-300">
                                {event.containerName}
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
}
