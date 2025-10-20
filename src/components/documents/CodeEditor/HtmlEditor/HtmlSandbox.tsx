import React from 'react';
import { observer } from 'mobx-react-lite';
import Alert from '@tdev-components/shared/Alert';
import _ from 'es-toolkit/compat';
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
interface IframeHrefMessage {
    type: 'href';
    id: string;
    href: string;
}

type IframeMessage = IframeErrorMessage | IframeResizeMessage | IframeHrefMessage;

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
            } else {
                const borderTopWidth = parseFloat(getComputedStyle(document.body).borderTopWidth);
                const borderBottomWidth = parseFloat(getComputedStyle(document.body).borderBottomWidth);
                const mTop = parseFloat(getComputedStyle(document.body).marginTop);
                const mBottom = parseFloat(getComputedStyle(document.body).marginBottom);
                const total = mTop + mBottom + borderTopWidth + borderBottomWidth;
                if (scrollHeight > document.body.clientHeight + total) {
                    parent.postMessage({id: '${id}', type: 'resize', height: document.body.clientHeight + total}, "*");
                }
            }
        } catch(_) {
            // Ignore errors
        }
    }, 200);
};
function onClick(event) {
    const target = event.target;
    const isLink = target && (target.tagName === 'A' || target.tagName === 'a') && target.href;
    if (!isLink) {
        return;
    }
    const href = target.getAttribute('href');
    const isExternal = href.startsWith('http://') || href.startsWith('https://');
    if (isExternal) {
        return; // Let the browser handle external links
    }
    event.preventDefault();
    parent.postMessage({id: '${id}', type: 'href', href: href}, "*");
    
};
window.onerror = onError;
window.onload = sendHeight;
window.onresize = sendHeight;
window.onclick = onClick;
</script>
<style>
body {
    display: flow-root;
}
</style>
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
    htmlTransformer?: (raw: string) => string;
    onNavigate?: (href: string) => void;
    allowSameOrigin?: boolean;
}

const DEFAULT_HEIGHT = 50;

const HtmlSandbox = observer((props: Props) => {
    const { id } = props;
    const [errorMsg, setErrorMsg] = React.useState<IframeErrorMessage | null>(null);
    const [height, setHeight] = React.useState<number>(DEFAULT_HEIGHT);
    const [htmlSrc, setHtmlSrc] = React.useState<string>(
        injectScript(id, props.htmlTransformer ? props.htmlTransformer(props.src) : props.src)
    );

    const throttledUpdate = React.useCallback(
        _.throttle(
            (newSrc: string, id: string) => {
                setErrorMsg(null);
                const transformer = props.htmlTransformer || ((s: string) => s);
                setHtmlSrc(injectScript(id, transformer(newSrc)));
            },
            500,
            { trailing: true, leading: true }
        ),
        [props.htmlTransformer]
    );

    React.useEffect(() => {
        throttledUpdate(props.src, id);
    }, [props.src, id, throttledUpdate]);

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
                case 'href':
                    props.onNavigate?.(e.data.href);
                    break;
            }
        };
        window.addEventListener('message', onMessage);
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [id, props.onNavigate]);

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
                sandbox={props.allowSameOrigin ? 'allow-same-origin allow-scripts' : 'allow-scripts'}
                allowFullScreen
            ></iframe>
        </div>
    );
});

export default HtmlSandbox;
