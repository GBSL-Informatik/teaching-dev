// vitest.config.ts
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        {
            name: 'tsx-and-mobx-decorators',
            enforce: 'pre',
            transform(code, id) {
                if (!/\.tsx?$/.test(id)) {
                    return;
                }
                if (!id.endsWith('.tsx') && !/^\s*@(observable|computed|action)/m.test(code)) {
                    return;
                }
                return transformWithEsbuild(code, id, { target: 'es2022', jsx: 'automatic' });
            }
        }
    ],
    resolve: {
        // Resolves to the framework sources only: site overrides from the tsconfig paths are not used in tests.
        alias: [
            {
                find: /^@tdev-(api|components|hooks|models|plugins|stores)\/(.*)$/,
                replacement: fileURLToPath(new URL('./src/$1/$2', import.meta.url))
            }
        ]
    },
    test: {
        coverage: {
            provider: 'v8',
            reporter: []
        }
    }
});
