import type { SnapshotResult } from '../api/servicesApi';

interface SnapshotsViewProps {
    lastSnapshot: SnapshotResult | null;
    isAdmin: boolean;
    creating: boolean;
    onTriggerSnapshot: () => void;
}

export function SnapshotsView({
                                  lastSnapshot,
                                  isAdmin,
                                  creating,
                                  onTriggerSnapshot,
                              }: SnapshotsViewProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div>
                    <h2 className="text-sm font-semibold text-white">
                        Infrastructure S3 Snapshot &amp; E-Mail Report (SeaweedFS + Mailpit)
                    </h2>
                    <p className="text-xs text-slate-400">
                        Exportiert den aktuellen Status aller Services in den S3-Bucket und versendet eine
                        Benachrichtigung.
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onTriggerSnapshot}
                        disabled={creating}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                    >
                        {creating ? 'Erstelle Snapshot...' : 'S3 Snapshot & Mail auslösen'}
                    </button>
                )}
            </div>

            {lastSnapshot && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                    <p className="font-semibold text-emerald-300">Snapshot erfolgreich erstellt:</p>
                    <ul className="mt-2 space-y-1 font-mono">
                        <li>Bucket: {lastSnapshot.bucket}</li>
                        <li>Object Key: {lastSnapshot.objectKey}</li>
                        <li>Notification: {lastSnapshot.notification}</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
