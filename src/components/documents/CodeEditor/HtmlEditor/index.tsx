import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { ScriptMeta } from '@tdev-models/documents/Script';
import { MetaProps } from '@tdev/theme/CodeBlock';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import CodeEditorComponent from '..';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import CodeBlock from '@theme/CodeBlock';
import Button from '@tdev-components/shared/Button';
import useIsBrowser from '@docusaurus/useIsBrowser';
import BrowserWindow from '@tdev-components/BrowserWindow';
import HtmlSandbox from './HtmlSandbox';

export interface Props extends Omit<MetaProps, 'live_jsx' | 'live_py' | 'title'> {
    title?: string;
    code?: string;
    maxHeight?: string | number;
    showLineNumbers?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const HtmlEditor = observer((props: Props) => {
    const id = props.slim ? undefined : props.id;
    const [meta] = React.useState(
        new ScriptMeta({
            title: 'website.html',
            ...props,
            code: props.code || '',
            lang: 'html',
            theme: 'xcode'
        })
    );
    const doc = useFirstMainDocument(id, meta);
    const isBrowser = useIsBrowser();
    if (!isBrowser || !doc) {
        return <CodeBlock language="html">{props.code}</CodeBlock>;
    }
    if (!doc.canDisplay && props.id) {
        return (
            <div>
                <PermissionsPanel documentRootId={props.id} />
            </div>
        );
    }

    return (
        <div className={clsx(styles.htmlEditor)}>
            <div className={clsx(styles.editor)}>
                <CodeEditorComponent script={doc} className={clsx(styles.code)} />
            </div>
            <BrowserWindow
                className={clsx(styles.htmlWindow)}
                bodyStyle={{ padding: 0 }}
                maxHeight={props.maxHeight ?? '400px'}
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
                    <HtmlSandbox src={doc?.code} />
                </ErrorBoundary>
            </BrowserWindow>
        </div>
    );
});

export default HtmlEditor;
