export type StatusFilter = 'ALL' | 'RUNNING' | 'STOPPED';
export type ViewMode = 'TABLE' | 'CARDS';

interface ServiceFilterBarProps {
    totalCount: number;
    runningCount: number;
    statusFilter: StatusFilter;
    onStatusFilterChange: (value: StatusFilter) => void;
    profiles: string[];
    profileFilter: string;
    onProfileFilterChange: (value: string) => void;
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    viewMode: ViewMode;
    onViewModeChange: (value: ViewMode) => void;
}

export function ServiceFilterBar({
                                     totalCount,
                                     runningCount,
                                     statusFilter,
                                     onStatusFilterChange,
                                     profiles,
                                     profileFilter,
                                     onProfileFilterChange,
                                     searchQuery,
                                     onSearchQueryChange,
                                     viewMode,
                                     onViewModeChange,
                                 }: ServiceFilterBarProps) {
    const tabs = [
        { key: 'ALL', label: `Alle (${totalCount})` },
        { key: 'RUNNING', label: `Laufend (${runningCount})` },
        { key: 'STOPPED', label: `Gestoppt (${totalCount - runningCount})` },
    ] as const;

    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onStatusFilterChange(tab.key)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                            statusFilter === tab.key
                                ? 'bg-sky-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <select
                    value={profileFilter}
                    onChange={(e) => onProfileFilterChange(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
                >
                    {profiles.map((p) => (
                        <option key={p} value={p}>
                            {p === 'ALL' ? 'Alle Profile' : `Profil: ${p}`}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    placeholder="Service oder Container suchen..."
                    className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500"
                />

                <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
                    {(['TABLE', 'CARDS'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            className={`rounded-md px-2.5 py-1 font-medium ${
                                viewMode === mode
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {mode === 'TABLE' ? 'Liste' : 'Karten'}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
