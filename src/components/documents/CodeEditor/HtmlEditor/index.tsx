import ErrorBoundary from '@docusaurus/ErrorBoundary';
import useIsBrowser from '@docusaurus/useIsBrowser';
import BrowserWindow from '@tdev-components/BrowserWindow';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import Button from '@tdev-components/shared/Button';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { useStore } from '@tdev-hooks/useStore';
import { CodeMeta } from '@tdev-models/documents/Code';
import { MetaProps } from '@tdev/theme/CodeBlock';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import CodeEditorComponent from '..';
import HtmlSandbox from './HtmlSandbox';
import styles from './styles.module.scss';

export interface Props extends Omit<Partial<MetaProps>, 'live_jsx' | 'live_py' | 'title'> {
    title?: string;
    code?: string;
    lang?: 'html' | 'css' | 'scss';
    maxHeight?: string | number;
    minHeight?: string | number;
    showLineNumbers?: boolean;
    className?: string;
    children?: React.ReactNode;
    htmlTransformer?: (raw: string) => string;
    onNavigate?: (href: string) => void;
    allowSameOrigin?: boolean;
}

const HtmlEditor = observer((props: Props) => {
    const id = props.slim ? undefined : props.id;
    const userStore = useStore('userStore');
    const meta = React.useMemo(
        () =>
            new CodeMeta({
                title: 'website.html',
                ...props,
                code: props.code || '',
                lang: props.lang ?? 'html'
            }),
        [props.id, props.code]
    );
    const doc = useFirstMainDocument(id, meta);
    const isBrowser = useIsBrowser();
    if (!isBrowser || !doc) {
        return <CodeBlock language="html">{props.code}</CodeBlock>;
    }
    if (!doc.canDisplay && props.id && !userStore.isUserSwitched) {
        return (
            <div>
                <PermissionsPanel documentRootId={props.id} />
            </div>
        );
    }

    return (
        <div className={clsx(styles.htmlEditor)}>
            <div className={clsx(styles.editor)}>
                <CodeEditorComponent code={doc} className={clsx(styles.code)} />
            </div>
            <BrowserWindow
                className={clsx(styles.htmlWindow)}
                bodyStyle={{ padding: 0 }}
                maxHeight={props.maxHeight ?? '400px'}
                minHeight={props.minHeight ?? '6em'}
                url={`file:///${doc.meta.title}`}
            >
                <ErrorBoundary
                    fallback={({ error, tryAgain }) => (
                        <div>
                            <div className={clsx('alert', 'alert--danger')} role="alert">
                                <div>Invalides HTML 😵‍💫: {error.message}</div>
                                Ändere den Code und versuche es erneut 😎.
                                <Button onClick={tryAgain}>Nochmal versuchen</Button>
                            </div>
                        </div>
                    )}
                >
                    <HtmlSandbox
                        src={doc.code}
                        id={doc.id}
                        htmlTransformer={props.htmlTransformer}
                        allowSameOrigin={props.allowSameOrigin}
                        onNavigate={props.onNavigate}
                    />
                </ErrorBoundary>
            </BrowserWindow>
        </div>
    );
});

export default HtmlEditor;
