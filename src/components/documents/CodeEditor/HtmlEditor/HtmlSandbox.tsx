import React from 'react';
import { observer } from 'mobx-react-lite';
import Alert from '@tdev-components/shared/Alert';
import _ from 'lodash';
import clsx from 'clsx';
import styles from './styles.module.scss';

interface IframeErrorMessage {
    type: 'error';
    error: string;
    lineno: number;
    colno: number;
}

interface IframeResizeMessage {
    type: 'resize';
    height: number;
}

type IframeMessage = IframeErrorMessage | IframeResizeMessage;

const ERROR_HANDLING_SCRIPT = `
<script>
function onError(message, source, lineno, colno, error) {
    try {
        parent.postMessage({type: 'error', error: message, lineno, colno}, "*");
    } catch(_) {
        // Ignore errors
    }
};

function sendHeight() {
    try {
        parent.postMessage({type: 'resize', height: document.body.scrollHeight}, "*");
    } catch(_) {
        // Ignore errors
    }
}
window.onerror = onError;
window.onload = sendHeight;
window.onresize = sendHeight;
</script>
`;

const injectScript = (html: string): string => {
    try {
        if (!html) return ERROR_HANDLING_SCRIPT;
        const headMatch = html.match(/<head[^>]*>/i);
        if (headMatch) {
            // insert after <head>
            return html.replace(/(<head[^>]*>)/i, `$1${ERROR_HANDLING_SCRIPT}`);
        }
        // No head, inject before first element
        const htmlTagMatch = html.match(/<html[^>]*>/i);
        if (htmlTagMatch) {
            // insert right after <html>
            return html.replace(/(<html[^>]*>)/i, `$1${ERROR_HANDLING_SCRIPT}`);
        }
        // No html/head, just prefix
        return ERROR_HANDLING_SCRIPT + html;
    } catch (err) {
        // Fallback – just prefix
        return ERROR_HANDLING_SCRIPT + (html || '');
    }
};
export interface Props {
    src: string;
}

const DEFAULT_HEIGHT = 300;

const HtmlSandbox = observer((props: Props) => {
    const [errorMsg, setErrorMsg] = React.useState<IframeErrorMessage | null>(null);
    const [height, setHeight] = React.useState<number>(DEFAULT_HEIGHT);
    const [htmlSrc, setHtmlSrc] = React.useState<string>(injectScript(props.src));

    const throttledUpdate = React.useRef(
        _.throttle(
            (newSrc: string) => {
                setErrorMsg(null);
                setHtmlSrc(injectScript(newSrc));
            },
            1000,
            { trailing: true, leading: true }
        )
    );
    React.useEffect(() => {
        throttledUpdate.current(props.src);
    }, [props.src]);

    React.useEffect(() => {
        const onMessage = (e: MessageEvent<IframeMessage>) => {
            switch (e.data.type) {
                case 'error':
                    setErrorMsg(e.data);
                    break;
                case 'resize':
                    // Handle resize messages if needed
                    setHeight(e.data.height + 40);
                    break;
            }
        };
        window.addEventListener('message', onMessage);
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, []);

    return (
        <div className={clsx(styles.sandbox)}>
            {errorMsg && (
                <Alert type="danger">
                    <div>Invalides HTML 😵‍💫:</div>
                    <div>
                        <pre>
                            <code style={{ color: 'var(--ifm-color-danger-darkest)' }}>{errorMsg.error}</code>
                        </pre>
                    </div>
                    <div>
                        Zeile: {errorMsg.lineno}, Zeichen: {errorMsg.colno}
                    </div>
                </Alert>
            )}
            <iframe
                srcDoc={htmlSrc}
                width="100%"
                height={`${height}px`}
                title="HTML Preview"
                sandbox="allow-scripts"
                allowFullScreen
            ></iframe>
        </div>
    );
});

export default HtmlSandbox;
