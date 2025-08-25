import React from 'react';
import { observer } from 'mobx-react-lite';
import Alert from '@tdev-components/shared/Alert';
import _ from 'lodash';
import clsx from 'clsx';
import styles from './styles.module.scss';

interface IframeErrorMessage {
    type: 'error';
    id: string;
    error: string;
    lineno: number;
    colno: number;
}

interface IframeResizeMessage {
    type: 'resize';
    id: string;
    height: number;
}

type IframeMessage = IframeErrorMessage | IframeResizeMessage;

const errorHandlingScript = (id: string) => `
<script>
function onError(message, source, lineno, colno, error) {
    try {
        parent.postMessage({id: '${id}', type: 'error', error: message, lineno, colno}, "*");
    } catch(_) {
        // Ignore errors
    }
};
function sendHeight() {
    setTimeout(() => {
        try {
            const {scrollHeight, clientHeight} = document.body.parentNode;
            if (scrollHeight !== clientHeight) {
                parent.postMessage({id: '${id}', type: 'resize', height: scrollHeight}, "*");
            }
        } catch(_) {
            // Ignore errors
        }
    }, 200);
}

window.onerror = onError;
window.onload = sendHeight;
window.onresize = sendHeight;
</script>
`;

const injectScript = (id: string, html: string): string => {
    try {
        const ERROR_HANDLING_SCRIPT = errorHandlingScript(id);
        if (!html) {
            return ERROR_HANDLING_SCRIPT;
        }
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
        return errorHandlingScript(id) + (html || '');
    }
};
export interface Props {
    src: string;
    id: string;
}

const DEFAULT_HEIGHT = 50;

const HtmlSandbox = observer((props: Props) => {
    const { id } = props;
    const [errorMsg, setErrorMsg] = React.useState<IframeErrorMessage | null>(null);
    const [height, setHeight] = React.useState<number>(DEFAULT_HEIGHT);
    const [htmlSrc, setHtmlSrc] = React.useState<string>(injectScript(id, props.src));

    const throttledUpdate = React.useRef(
        _.throttle(
            (newSrc: string, id: string) => {
                setErrorMsg(null);
                setHtmlSrc(injectScript(id, newSrc));
            },
            1000,
            { trailing: true, leading: true }
        )
    );
    React.useEffect(() => {
        throttledUpdate.current(props.src, id);
    }, [props.src, id]);

    React.useEffect(() => {
        const onMessage = (e: MessageEvent<IframeMessage>) => {
            if (e.data.id !== id) {
                return;
            }
            switch (e.data.type) {
                case 'error':
                    setErrorMsg(e.data);
                    break;
                case 'resize':
                    setHeight(e.data.height);
                    break;
            }
        };
        window.addEventListener('message', onMessage);
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [id]);

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
