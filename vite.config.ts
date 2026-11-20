import { createHash } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const email = loadEnv(mode, process.cwd(), '').GRAVATAR_EMAIL?.trim().toLowerCase();
    const hash = email ? createHash('sha256').update(email).digest('hex') : '';

    return {
        plugins: [react()],
        define: { __GRAVATAR_HASH__: JSON.stringify(hash) },
        build: { sourcemap: false },
        test: { environment: 'jsdom', globals: true },
    };
});