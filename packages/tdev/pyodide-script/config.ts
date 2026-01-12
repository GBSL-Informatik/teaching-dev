export const DOCUSAURUS_SW_SCOPE = '/' as const;

export const PY_INPUT = 'PY_INPUT' as const;
export const PY_AWAIT_INPUT = 'PY_AWAIT_INPUT' as const;
export const PY_STDIN_ROUTE = `${DOCUSAURUS_SW_SCOPE}py-get-input/` as const;
export const PY_CANCEL_INPUT = 'PY_CANCEL_INPUT' as const;
// process.env.NODE_ENV === 'production' ? ('/assets/js/' as const) : ('/' as const);

interface LogBase {
    id: string;
    timeStamp: number;
    message: string;
}

interface LogMessage extends LogBase {
    type: 'log';
}
interface ErrorMessage extends LogBase {
    type: 'error';
}

export type Message = LogMessage | ErrorMessage;
