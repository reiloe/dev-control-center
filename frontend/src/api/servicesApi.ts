export interface ServiceStatus {
    containerName: string;
    serviceName: string;
    profile: string;
    state: 'RUNNING' | 'EXITED' | 'NOT_CREATED' | string;
    statusText: string;
    webUiUrl: string | null;
}

const API_BASE = '/api/services';

export async function fetchServices(): Promise<ServiceStatus[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
    }
    return response.json();
}

export async function controlService(
    containerName: string,
    action: 'start' | 'stop'
): Promise<void> {
    const response = await fetch(`${API_BASE}/${containerName}/${action}`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error(`Failed to ${action} ${containerName}`);
    }
}

export async function fetchContainerLogs(
    containerName: string,
    tail = 100
): Promise<string[]> {
    const response = await fetch(`${API_BASE}/${containerName}/logs?tail=${tail}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch logs for ${containerName}`);
    }
    return response.json();
}

export interface AuditEvent {
    id: number;
    containerName: string;
    action: 'START' | 'STOP' | string;
    actor: string;
    occurredAt: string;
}

export interface SnapshotResult {
    bucket: string;
    objectKey: string;
    notification: string;
}

export async function fetchAuditEvents(): Promise<AuditEvent[]> {
    const response = await fetch('/api/audit');
    if (!response.ok) {
        throw new Error('Failed to fetch audit events');
    }
    return response.json();
}

export async function triggerSnapshot(): Promise<SnapshotResult> {
    const response = await fetch('/api/snapshots', { method: 'POST' });
    if (!response.ok) {
        throw new Error('Failed to create snapshot (is Seaweedfs & Mailpit running?)');
    }
    return response.json();
}

