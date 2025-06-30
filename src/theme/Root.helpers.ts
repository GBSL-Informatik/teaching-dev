export const noAuthMessage = (username?: string) => {
    const n = (username?.length || 0) >= 35 ? 0 : 35 - (username?.length || 0);
    return [
        '',
        '┌─────────────────────────────────────────────────────────────┐',
        '│                                                             │',
        '│   _   _                       _   _                         │',
        '│  | \\ | |           /\\        | | | |                        │',
        '│  |  \\| | ___      /  \\  _   _| |_| |__                      │',
        "│  | . ` |/ _ \\    / /\\ \\| | | | __| '_ \\                     │",
        '│  | |\\  | (_) |  / ____ \\ |_| | |_| | | |                    │',
        '│  |_| \\_|\\___/  /_/    \\_\\__,_|\\__|_| |_|                    │',
        '│                                                             │',
        '│                                                             │',
        `│   Current test username: ${username + ' '.repeat(n)}│`,
        '│                                                             │',
        '│  --> enable authentication by removing "DEFAULT_TEST_USER"  │',
        '│       from the environment (or the .env file)               │',
        '└─────────────────────────────────────────────────────────────┘'
    ].join('\n');
};

const MEMEORY_ADAPTER_MESSAGE = [
    '│                                                      │',
    '│  All API-Calls are handled client-side, all changes  │',
    '│  will be lost on reload and SocketIo will not work.  │',
    '│                                                      │',
    '│  The user will always be offline.user@tdev.ch!       │',
    '│                                                      │',
    '│  --> enable api calls by removing "OFFLINE_API" from │',
    '│      the environment (or the .env file)              │'
];

const INDEXDB_ADAPTER_MESSAGE = [
    '│                                                      │',
    '│ A local IndexDB is used to store changes.            │',
    '│                                                      │'
];

export const offlineApiMessage = (dbAdapter: boolean | 'memory' | 'indexDb') => {
    return [
        '',
        '┌──────────────────────────────────────────────────────┐',
        '│      ____  _____  _____  _     _  _   _ ______       │',
        '│     / __ \\|  ___||  ___|| |   | || \\ | |  ____|      │',
        '│    | |  | | |__  | |_   | |   | ||  \\| | |__         │',
        '│    | |  | |  __| |  _|  | |   | || . ` |  __|        │',
        '│    | |__| | |    | |    | |__ | || |\\  | |____       │',
        '│     \\____/|_|    |_|    |____||_||_| \\_|______|      │',
        '│                                                      │',
        ...(dbAdapter === 'indexDb' ? INDEXDB_ADAPTER_MESSAGE : MEMEORY_ADAPTER_MESSAGE),
        '└──────────────────────────────────────────────────────┘'
    ].join('\n');
};
