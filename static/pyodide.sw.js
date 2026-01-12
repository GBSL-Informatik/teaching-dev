const DOCUSAURUS_SW_SCOPE = '/';
const PY_INPUT = 'PY_INPUT';
const PY_AWAIT_INPUT = 'PY_AWAIT_INPUT';
const PY_STDIN_ROUTE = `${DOCUSAURUS_SW_SCOPE}py-get-input/`;
const PY_CANCEL_INPUT = 'PY_CANCEL_INPUT';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    self.clients.claim();
});

const resolvers = new Map();

self.addEventListener('message', (event) => {
    switch (event.data.type) {
        case PY_INPUT: {
            const resolverArray = resolvers.get(event.data.id);
            const resolver = resolverArray && resolverArray.shift();
            if (!resolver) {
                console.error('Error handling input: No resolver');
                return;
            }
            console.log('Resolving input for id', event.data.id, 'with value', event.data.value);
            resolver(new Response(event.data.value, { status: 200 }));
            break;
        }
        case PY_CANCEL_INPUT: {
            const rejecterArray = resolvers.get(event.data.id);
            const rejecter = rejecterArray && rejecterArray.shift();
            if (!rejecter) {
                console.error('Error handling input: No resolver');
                return;
            }
            rejecter(new Response('Run cancelled', { status: 410 }));
            break;
        }
        default:
            return;
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname !== PY_STDIN_ROUTE) {
        return;
    }

    const id = url.searchParams.get('id');
    if (!id) {
        console.error('Error handling input: No id');
        return;
    }
    const prompt = url.searchParams.get('prompt');

    event.waitUntil(
        self.clients
            .matchAll()
            .then((clients) => {
                clients.forEach((client) => {
                    if (client.type === 'window') {
                        client.postMessage({
                            type: PY_AWAIT_INPUT,
                            id,
                            prompt
                        });
                    }
                });
            })
            .catch((err) => console.error('Error matching clients', err))
    );

    const promise = new Promise((resolve) => {
        const resolverArray = resolvers.get(id) || [];
        resolverArray.push(resolve);
        resolvers.set(id, resolverArray);
    });
    event.respondWith(promise);
});
