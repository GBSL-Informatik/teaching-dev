import { createRequire } from 'node:module';
import path from 'node:path';
import { loadPyodide, type PyodideAPI } from 'pyodide';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineWorkerExtension } from '../extensions';
import { createWorkerExtensions } from '../extensions/worker';
import { registerPythonModule } from '../workers/registerPythonModule';

let pyodide: PyodideAPI;

beforeAll(async () => {
    const require = createRequire(import.meta.url);
    const indexURL = `${path.dirname(require.resolve('pyodide/package.json'))}/`;
    pyodide = await loadPyodide({ indexURL });
}, 30000);

describe('Python extension modules', () => {
    it('imports JavaScript bridges and supports decorators needing module metadata', async () => {
        const extension = defineWorkerExtension(() => ({ _test_grid_bridge: { value: 42 } }), {
            _test_grid_python: `
from dataclasses import dataclass
from _test_grid_bridge import value

@dataclass
class Example:
    value: int = value
`
        });
        const session = createWorkerExtensions(
            { id: 'editor', getTime: Date.now, sendMessage: () => {} },
            [{ name: 'example', extension }],
            (extension, targetId) => ({ extension, targetId, executionId: 1 })
        );
        session.register(pyodide);
        expect(pyodide.runPython('__import__("_test_grid_python").Example().value')).toBe(42);
        expect(pyodide.runPython('__import__("_test_grid_python").__file__')).toBe('_test_grid_python.py');
        await session.finish();
    });

    it('replaces module globals on registration for a new execution', () => {
        registerPythonModule(pyodide, '_test_grid_fresh', 'old_value = 1');
        registerPythonModule(pyodide, '_test_grid_fresh', 'new_value = 2');
        expect(pyodide.runPython('hasattr(__import__("_test_grid_fresh"), "old_value")')).toBe(false);
        expect(pyodide.runPython('__import__("_test_grid_fresh").new_value')).toBe(2);
    });

    it('removes failed modules and preserves their original initialization error', () => {
        expect(() =>
            registerPythonModule(pyodide, '_test_grid_failure', 'raise ValueError("initial failure")')
        ).toThrow('initial failure');
        expect(pyodide.runPython('"_test_grid_failure" in __import__("sys").modules')).toBe(false);

        expect(() =>
            registerPythonModule(
                pyodide,
                '_test_grid_failure',
                `
import sys
del sys.modules[__name__]
raise ValueError('original failure after removal')
`
            )
        ).toThrow('original failure after removal');
    });
});
