// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { transformWithEsbuild } from 'vite';

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
    test: {
        coverage: {
            provider: 'v8',
            reporter: []
        }
    }
});
