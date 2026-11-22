import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { keycloak } from './auth/keycloak.ts';

keycloak
    .init({ onLoad: 'login-required', checkLoginIframe: false })
    .then(() => {
        createRoot(document.getElementById('root')!).render(
            <StrictMode>
                <App />
            </StrictMode>
        );
    })
    .catch((err) => {
        console.error('Keycloak initialization failed', err);
    });
