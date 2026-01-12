import { DOCUSAURUS_SW_SCOPE } from '../config';

addEventListener('install', () => {
    // @ts-ignore
    self.skipWaiting();
});

addEventListener('activate', () => {
    // @ts-ignore
    self.clients.claim();
});

const resolvers = new Map<string, ((value: Response) => void)[]>();

const PY_INPUT = 'PY_INPUT' as const;
const PY_AWAIT_INPUT = 'PY_AWAIT_INPUT' as const;
const PY_STDIN_ROUTE = `${DOCUSAURUS_SW_SCOPE}py-get-input/` as const;
const PY_CANCEL_INPUT = 'PY_CANCEL_INPUT' as const;

addEventListener('message', (event) => {
    switch (event.data.type) {
        case PY_INPUT:
            const resolverArray = resolvers.get(event.data.id);
            const resolver = resolverArray?.shift();
            if (!resolver) {
                console.error('Error handing input: No resolver');
                return;
            }
            console.log('Resolving input for id', event.data.id, 'with value', event.data.value);
            resolver(new Response(event.data.value, { status: 200 }));
            break;
        case PY_CANCEL_INPUT:
            const rejecterArray = resolvers.get(event.data.id);
            const rejecter = rejecterArray?.shift();
            if (!rejecter) {
                console.error('Error handing input: No resolver');
                return;
            }
            rejecter(new Response('Run cancelled', { status: 410 }));
            break;
        default:
            return;
    }
});

addEventListener('fetch', (_event) => {
    const event = _event as FetchEvent;
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
        (async () => {
            // Send PY_AWAIT_INPUT message to all window clients
            (self as unknown as ServiceWorkerGlobalScope).clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    if (client.type === 'window') {
                        client.postMessage({
                            type: PY_AWAIT_INPUT,
                            id,
                            prompt
                        });
                    }
                });
            });
        })()
    );

    const promise = new Promise<Response>((resolve, reject) => {
        const resolverArray = resolvers.get(id) || [];
        resolverArray.push(resolve);
        return resolvers.set(id, resolverArray);
    });
    event.respondWith(promise as unknown as Response);
});
