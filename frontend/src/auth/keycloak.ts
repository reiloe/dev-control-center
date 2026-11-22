import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
    url: 'http://localhost:8086',
    realm: 'dev-control-center',
    clientId: 'control-center-frontend',
});

export function isAdmin(): boolean {
    return keycloak.hasRealmRole('ADMIN');
}

export function getUsername(): string {
    return (keycloak.tokenParsed?.preferred_username as string) ?? 'Unknown';
}
