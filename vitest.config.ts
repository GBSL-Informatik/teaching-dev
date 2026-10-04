// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { transform } from 'esbuild';

export default defineConfig({
    plugins: [
        {
            name: 'serial-decorators',
            enforce: 'pre',
            async transform(code, id) {
                if (/packages\/(tdev\/webserial|hfr\/radar)\/.*\.tsx?$/.test(id)) {
                    return transform(code, {
                        loader: id.endsWith('.tsx') ? 'tsx' : 'ts',
                        target: 'es2022',
                        tsconfigRaw: { compilerOptions: { experimentalDecorators: false } }
                    });
                }
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
