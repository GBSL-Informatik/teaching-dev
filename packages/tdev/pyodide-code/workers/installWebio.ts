import source from '!!raw-loader!./webio.py';
import type { PyodideAPI } from 'pyodide';
import type WorkerEventSession from './WorkerEventSession';

export const installWebio = (pyodide: PyodideAPI, session: WorkerEventSession) => {
    const module = pyodide.runPython('__import__("types").ModuleType("webio")');
    const namespace = module.__dict__;
    const modules = pyodide.pyimport('sys.modules');
    try {
        namespace.set('_bridge', {
            open: (sources: string) => session.open(sources),
            next_event: () => session.nextEvent(),
            next_frame: (delayMs: number) => session.nextFrame(delayMs),
            stop: () => session.stop(),
            close: () => session.close()
        });
        pyodide.runPython(source, { globals: namespace, filename: 'webio.py' });
        modules.set('webio', module);
    } finally {
        modules.destroy();
        namespace.destroy();
        module.destroy();
    }
    return () => {
        const modules = pyodide.pyimport('sys.modules');
        try {
            modules.delete('webio');
        } finally {
            modules.destroy();
        }
    };
};
