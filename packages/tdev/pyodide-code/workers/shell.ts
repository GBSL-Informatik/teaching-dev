import type { PyodideAPI } from 'pyodide';

const SHELL_WRAPPER = `
def configure_shell(clear_console):
    import os, sys
    original_system = os.system

    def system(command):
        if isinstance(command, str) and command.strip() in ("clear", "cls"):
            sys.stdout.flush()
            sys.stderr.flush()
            clear_console()
            return 0
        return original_system(command)

    def restore():
        os.system = original_system

    os.system = system
    return restore

configure_shell(clear_console)
`;

export const configureShell = (pyodide: PyodideAPI, clearConsole: () => void) => {
    const globals = pyodide.toPy({ clear_console: clearConsole });
    try {
        const restore = pyodide.runPython(SHELL_WRAPPER, { globals });
        return () => {
            try {
                restore();
            } finally {
                restore.destroy();
            }
        };
    } finally {
        globals.destroy();
    }
};
