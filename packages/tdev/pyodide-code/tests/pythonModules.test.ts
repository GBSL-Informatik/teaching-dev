import { readFileSync } from 'node:fs';
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

describe('webio event payloads', () => {
    beforeAll(() => {
        const source = readFileSync(new URL('../workers/webio.py', import.meta.url), 'utf8');
        registerPythonModule(pyodide, '_test_webio', source);
        pyodide.runPython(`
from _test_webio import _decode_event

def decode_payload(payload):
    return _decode_event({
        'event': {'type': 'click', 'payload': payload},
        'extension': 'example',
        'targetId': 'target',
        'timeStamp': 1000,
    })
`);
    });

    it.each([0.75, -1])('reads value %s using attributes and dictionary access', (value) => {
        expect(
            pyodide.runPython(`
payload = decode_payload({'value': ${value}}).payload
payload.value == payload['value'] == ${value}
`)
        ).toBe(true);
    });

    it('preserves dictionary methods and normal missing-attribute behavior', () => {
        expect(
            pyodide.runPython(`
payload = decode_payload({'key': 'ArrowLeft', 'items': 42}).payload
assert payload.key == payload.get('key') == 'ArrowLeft'
assert dict(payload) == {'key': 'ArrowLeft', 'items': 42}
assert callable(payload.items)
assert payload['items'] == 42
assert not hasattr(payload, 'missing')
getattr(payload, 'missing', 'fallback')
`)
        ).toBe('fallback');
    });

    it('keeps coordinates available on both the event and its payload', () => {
        expect(
            pyodide.runPython(`
event = decode_payload({'x': 10, 'y': 20})
event.x == event.payload.x == event.payload['x'] == 10 and event.y == event.payload.y == 20
`)
        ).toBe(true);
    });

    it('preserves payloads that are not dictionaries', () => {
        expect(
            pyodide.runPython(`
all(decode_payload(value).payload == value for value in (None, 42, 'text', [1, 2]))
`)
        ).toBe(true);
    });
});
