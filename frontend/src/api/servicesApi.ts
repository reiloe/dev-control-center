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
