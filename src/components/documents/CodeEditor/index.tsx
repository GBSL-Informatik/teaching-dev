import * as React from 'react';
import styles from './styles.module.scss';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ScriptMeta } from '@tdev-models/documents/Script';
import Editor from './Editor';
import CodeHistory from './CodeHistory';
import { MetaProps } from '@tdev/theme/CodeBlock';
import { observer } from 'mobx-react-lite';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import useCodeTheme from '@tdev-hooks/useCodeTheme';
import iScript from '@tdev-models/documents/iScript';
import { ScriptTypes } from '@tdev-api/document';

export interface Props extends Omit<MetaProps, 'live_jsx' | 'live_py'> {
    title: string;
    lang: string;
    preCode: string;
    postCode: string;
    code: string;
    showLineNumbers: boolean;
    className?: string;
    theme?: string;
}

export const CodeEditor = observer((props: Props) => {
    const id = props.slim ? undefined : props.id;
    const [meta] = React.useState(new ScriptMeta(props));
    const script = useFirstMainDocument(id, meta, true, {}, meta.versioned ? 'script' : undefined);
    React.useEffect(() => {
        if (script && script.meta?.slim) {
            script.setCode(props.code);
        }
    }, [script, props.code]);
    if (!ExecutionEnvironment.canUseDOM || !script) {
        return <CodeBlock language={props.lang}>{props.code}</CodeBlock>;
    }
    return <CodeEditorComponent script={script} className={props.className} />;
});

export interface ScriptProps<T extends ScriptTypes> {
    script: iScript<T>;
    className?: string;
}

const CodeEditorComponent = observer(<T extends ScriptTypes>(props: ScriptProps<T>) => {
    const { script } = props;
    const { colorMode } = useCodeTheme();
    return (
        <div className={clsx(styles.wrapper, 'notranslate', props.className)}>
            <div
                className={clsx(
                    styles.playgroundContainer,
                    colorMode === 'light' && styles.lightTheme,
                    script.meta.slim ? styles.containerSlim : styles.containerBig,
                    'live_py'
                )}
            >
                <Editor script={script} />
                {script.meta.hasHistory && <CodeHistory script={script} />}
            </div>
        </div>
    );
});

export default CodeEditorComponent;
