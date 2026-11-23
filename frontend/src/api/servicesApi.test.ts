import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchServices } from './servicesApi';

vi.mock('../auth/keycloak', () => ({
    keycloak: {
        token: 'mock-jwt-token',
        updateToken: vi.fn().mockResolvedValue(true),
        login: vi.fn(),
    },
}));

describe('servicesApi', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches services with Authorization bearer header', async () => {
        const mockData = [{ containerName: 'dev-postgres', serviceName: 'PostgreSQL', state: 'RUNNING' }];
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => mockData,
        } as Response);

        const result = await fetchServices();

        expect(fetchSpy).toHaveBeenCalledWith('/api/services', {
            headers: { Authorization: 'Bearer mock-jwt-token' },
        });
        expect(result).toEqual(mockData);
    });
});
