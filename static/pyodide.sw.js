const PY_INPUT = 'PY_INPUT';
const PY_CLIENT_ID = 'PY_CLIENT_ID';
const PY_AWAIT_INPUT = 'PY_AWAIT_INPUT';
const PY_STDIN_ROUTE = '/py-get-input/';
const PY_CANCEL_INPUT = 'PY_CANCEL_INPUT';
const PY_CANCEL_ALL = 'PY_CANCEL_ALL';
const INPUT_POLL_TIMEOUT = 10000;
const INPUT_RECONNECT_TIMEOUT = 60000;

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

const requests = new Map();

const completeRequest = (requestId, response) => {
    const request = requests.get(requestId);
    if (!request || request.response) {
        return;
    }
    if (!request.resolve) {
        // Preserve replies and cancellation received between polls.
        request.response = response;
        return;
    }
    clearTimeout(request.timer);
    requests.delete(requestId);
    request.resolve(response);
};

const pollInput = (requestId, request) => {
    clearTimeout(request.timer);
    if (request.response) {
        requests.delete(requestId);
        return request.response;
    }
    return new Promise((resolve) => {
        request.resolve = resolve;
        // Keep each fetch below browser service-worker event time limits.
        request.timer = setTimeout(() => {
            request.resolve = null;
            request.timer = setTimeout(() => requests.delete(requestId), INPUT_RECONNECT_TIMEOUT);
            resolve(new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }));
        }, INPUT_POLL_TIMEOUT);
    });
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
        completeRequest(
            event.data.requestId,
            new Response(event.data.value, { status: 200, headers: { 'Cache-Control': 'no-store' } })
        );
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
    const existingRequest = requests.get(requestId);
    if (existingRequest) {
        if (
            existingRequest.clientId !== clientId ||
            existingRequest.id !== id ||
            existingRequest.executionId !== executionId ||
            existingRequest.resolve
        ) {
            event.respondWith(new Response('Conflicting input request', { status: 409 }));
            return;
        }
        event.respondWith(pollInput(requestId, existingRequest));
        return;
    }
    const request = { clientId, id, executionId, resolve: null, response: null, timer: null };
    requests.set(requestId, request);
    event.respondWith(pollInput(requestId, request));
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
