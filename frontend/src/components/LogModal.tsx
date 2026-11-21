import { useEffect, useState } from 'react';
import { X, RefreshCw, Terminal } from 'lucide-react';
import { fetchContainerLogs } from '../api/servicesApi';

interface LogModalProps {
    containerName: string;
    serviceName: string;
    onClose: () => void;
}

export function LogModal({ containerName, serviceName, onClose }: LogModalProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const lines = await fetchContainerLogs(containerName, 120);
            setLogs(lines);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [containerName]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Terminal className="h-5 w-5 text-cyan-400" />
                        <div>
                            <h3 className="font-semibold text-white">{serviceName} Logs</h3>
                            <p className="text-xs text-slate-400">{containerName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadLogs}
                            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
                    {error ? (
                        <p className="text-rose-400">{error}</p>
                    ) : logs.length === 0 && !loading ? (
                        <p className="text-slate-500">No log output available.</p>
                    ) : (
                        logs.map((line, index) => (
                            <div key={index} className="border-b border-slate-900/60 py-0.5 break-all">
                                {line}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
