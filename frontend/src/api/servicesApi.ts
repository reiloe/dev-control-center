import { keycloak } from '../auth/keycloak';

export interface ServiceStatus {
    containerName: string;
    serviceName: string;
    profile: string;
    state: 'RUNNING' | 'EXITED' | 'NOT_CREATED' | string;
    statusText: string;
    webUiUrl: string | null;
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

async function authHeaders(): Promise<HeadersInit> {
    if (keycloak.token) {
        await keycloak.updateToken(30).catch(() => keycloak.login());
        return { Authorization: `Bearer ${keycloak.token}` };
    }
    return {};
}

export async function fetchServices(): Promise<ServiceStatus[]> {
    const response = await fetch('/api/services', {
        headers: await authHeaders(),
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
    }
    return response.json();
}

export async function controlService(
    containerName: string,
    action: 'start' | 'stop'
): Promise<void> {
    const response = await fetch(`/api/services/${containerName}/${action}`, {
        method: 'POST',
        headers: await authHeaders(),
    });
    if (!response.ok) {
        throw new Error(`Failed to ${action} ${containerName}`);
    }
}

export async function fetchContainerLogs(
    containerName: string,
    tail = 100
): Promise<string[]> {
    const response = await fetch(`/api/services/${containerName}/logs?tail=${tail}`, {
        headers: await authHeaders(),
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch logs for ${containerName}`);
    }
    return response.json();
}

export async function fetchAuditEvents(): Promise<AuditEvent[]> {
    const response = await fetch('/api/audit', {
        headers: await authHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch audit events');
    }
    return response.json();
}

export async function triggerSnapshot(): Promise<SnapshotResult> {
    const response = await fetch('/api/snapshots', {
        method: 'POST',
        headers: await authHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to create snapshot (is SeaweedFS & Mailpit running?)');
    }
    return response.json();
}
