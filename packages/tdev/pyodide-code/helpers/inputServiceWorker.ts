import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { PY_CLIENT_ID } from '../config';
import { withTimeout } from './withTimeout';

const STARTUP_TIMEOUT = 15000;

export const initializeInputServiceWorker = async (baseUrl: string) => {
    if (!ExecutionEnvironment.canUseDOM || !('serviceWorker' in navigator)) {
        throw new Error('Python input requires service workers in a secure browser context.');
    }
    const registration = await withTimeout(
        navigator.serviceWorker.register(`${baseUrl}pyodide.sw.js`, { scope: baseUrl, type: 'module' }),
        STARTUP_TIMEOUT,
        'Python input service worker registration timed out.'
    );
    const worker = registration.active || registration.installing || registration.waiting;
    if (!worker) {
        throw new Error('Python input service worker was not installed.');
    }
    await waitForActivation(worker);

    // Retry against the current worker while a protocol update activates.
    for (let attempt = 0; attempt < 3; attempt++) {
        const current = await navigator.serviceWorker.getRegistration(baseUrl);
        const serviceWorker = current?.active || registration.active;
        if (!serviceWorker) {
            continue;
        }
        const clientId = await requestClientId(serviceWorker);
        if (clientId) {
            await waitForController(serviceWorker);
            return { serviceWorker, clientId };
        }
    }
    throw new Error('Python input service worker did not respond. Update pyodide.sw.js and retry.');
};

const waitForActivation = async (worker: ServiceWorker) => {
    let handleStateChange = () => {};
    const activation = new Promise<void>((resolve, reject) => {
        handleStateChange = () => {
            if (worker.state === 'activated') {
                resolve();
            } else if (worker.state === 'redundant') {
                reject(new Error('Python input service worker installation failed.'));
            }
        };
        worker.addEventListener('statechange', handleStateChange);
        handleStateChange();
    });
    try {
        await withTimeout(activation, STARTUP_TIMEOUT, 'Python input service worker activation timed out.');
    } finally {
        worker.removeEventListener('statechange', handleStateChange);
    }
};

const waitForController = async (worker: ServiceWorker) => {
    let handleControllerChange = () => {};
    const control = new Promise<void>((resolve) => {
        handleControllerChange = () => {
            if (navigator.serviceWorker.controller === worker) {
                resolve();
            }
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        handleControllerChange();
    });
    try {
        await withTimeout(control, STARTUP_TIMEOUT, 'Python input service worker did not take control.');
    } finally {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    }
};

const requestClientId = (worker: ServiceWorker): Promise<string | null> =>
    new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        const finish = (value: string | null) => {
            clearTimeout(timer);
            channel.port1.close();
            resolve(value);
        };
        const timer = setTimeout(() => finish(null), 2000);
        channel.port1.onmessage = (event) => finish(event.data.clientId);
        try {
            worker.postMessage({ type: PY_CLIENT_ID }, [channel.port2]);
        } catch (error) {
            clearTimeout(timer);
            channel.port1.close();
            reject(error);
        }
    });
