import ErrorBoundary from '@docusaurus/ErrorBoundary';
import useIsBrowser from '@docusaurus/useIsBrowser';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { useStore } from '@tdev-hooks/useStore';
import { CodeMeta } from '@tdev-models/documents/Code';
import { MetaProps } from '@tdev/theme/CodeBlock';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import CodeEditorComponent from '..';
import styles from './styles.module.scss';

export interface Props extends Omit<Partial<MetaProps>, 'live_jsx' | 'live_py' | 'title'> {
    title?: string;
    code?: string;
    showLineNumbers?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const SvgEditor = observer((props: Props) => {
    const id = props.slim ? undefined : props.id;
    const userStore = useStore('userStore');
    const [meta] = React.useState(
        new CodeMeta({ title: 'SVG', ...props, code: props.code || '', lang: 'svg' })
    );
    const doc = useFirstMainDocument(id, meta);
    const isBrowser = useIsBrowser();
    if (!isBrowser || !doc) {
        return <CodeBlock language="svg">{props.code}</CodeBlock>;
    }
    if (!doc.canDisplay && props.id && !userStore.isUserSwitched) {
        return (
            <div>
                <PermissionsPanel documentRootId={props.id} />
            </div>
        );
    }

    return (
        <div className={clsx(styles.svgEditor)}>
            <div className={clsx(styles.editor)}>
                <CodeEditorComponent code={doc} className={clsx(styles.code)} />
            </div>
            <Card classNames={{ card: styles.svgCard, body: styles.svgCardBody }}>
                <ErrorBoundary
                    fallback={({ error, tryAgain }) => (
                        <div>
                            <div className={clsx('alert', 'alert--danger')} role="alert">
                                <div>Invalides SVG 😵‍💫: {error.message}</div>
                                Ändere den Code und versuche es erneut 😎.
                                <Button onClick={tryAgain}>Nochmal versuchen</Button>
                            </div>
                        </div>
                    )}
                >
                    <div className={clsx(styles.svgResult)} dangerouslySetInnerHTML={{ __html: doc?.code }} />
                </ErrorBoundary>
            </Card>
        </div>
    );
});

export default SvgEditor;
