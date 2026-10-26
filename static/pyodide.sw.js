const PY_INPUT = 'PY_INPUT';
const PY_CLIENT_ID = 'PY_CLIENT_ID';
const PY_AWAIT_INPUT = 'PY_AWAIT_INPUT';
const PY_STDIN_ROUTE = '/py-get-input/';
const PY_CANCEL_INPUT = 'PY_CANCEL_INPUT';
const PY_CANCEL_ALL = 'PY_CANCEL_ALL';

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

const requests = new Map();

const completeRequest = (requestId, response) => {
    const request = requests.get(requestId);
    if (!request) {
        return;
    }
    requests.delete(requestId);
    request.resolve(response);
};

self.addEventListener('message', (event) => {
    const clientId = event.source?.id;
    if (!clientId) {
        return;
    }
    if (event.data.type === PY_CLIENT_ID) {
        event.ports[0]?.postMessage({ clientId });
        return;
    }
    if (event.data.type === PY_CANCEL_ALL) {
        for (const [requestId, request] of requests) {
            if (request.clientId === clientId) {
                completeRequest(requestId, new Response('Run cancelled', { status: 410 }));
            }
        }
        return;
    }
    const request = requests.get(event.data.requestId);
    if (!request || request.clientId !== clientId) {
        return;
    }
    if (event.data.type === PY_INPUT) {
        completeRequest(event.data.requestId, new Response(event.data.value, { status: 200 }));
    } else if (event.data.type === PY_CANCEL_INPUT) {
        completeRequest(event.data.requestId, new Response('Run cancelled', { status: 410 }));
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin || url.pathname !== PY_STDIN_ROUTE) {
        return;
    }
    const id = url.searchParams.get('id');
    const clientId = url.searchParams.get('clientId');
    const requestId = url.searchParams.get('requestId');
    const executionId = Number(url.searchParams.get('executionId'));
    if (!id || !clientId || !requestId || !Number.isSafeInteger(executionId) || executionId < 1) {
        event.respondWith(new Response('Invalid input request', { status: 400 }));
        return;
    }
    if (requests.has(requestId)) {
        event.respondWith(new Response('Duplicate input request', { status: 409 }));
        return;
    }
    event.respondWith(
        new Promise((resolve) => {
            requests.set(requestId, { clientId, resolve });
        })
    );
    event.waitUntil(
        self.clients
            .get(clientId)
            .then((client) => {
                if (!client || client.type !== 'window') {
                    completeRequest(requestId, new Response('Input owner closed', { status: 410 }));
                    return;
                }
                client.postMessage({
                    type: PY_AWAIT_INPUT,
                    id,
                    requestId,
                    executionId,
                    prompt: url.searchParams.get('prompt') || ''
                });
            })
            .catch(() => {
                completeRequest(requestId, new Response('Input owner unavailable', { status: 410 }));
            })
    );
});
