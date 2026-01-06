import * as React from 'react';
import styles from './styles.module.scss';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Script, { ScriptMeta } from '@tdev-models/documents/Script';
import Editor from '../Editor';
import CodeHistory from '../CodeHistory';
import BrythonCommunicator from './BrythonCommunicator';
import { MetaProps } from '@tdev/theme/CodeBlock';
import { observer } from 'mobx-react-lite';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { DocContext } from '@tdev-components/documents/DocumentContext';
import useCodeTheme from '@tdev-hooks/useCodeTheme';

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
    const script = useFirstMainDocument(id, new ScriptMeta(props));
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

export interface ScriptProps {
    script: Script;
    className?: string;
}

const CodeEditorComponent = observer((props: ScriptProps) => {
    const { script } = props;
    const { colorMode } = useCodeTheme();
    return (
        <div className={clsx(styles.wrapper, 'notranslate', props.className)}>
            <DocContext.Provider value={script}>
                <div
                    className={clsx(
                        styles.playgroundContainer,
                        colorMode === 'light' && styles.lightTheme,
                        script.meta.slim ? styles.containerSlim : styles.containerBig,
                        'live_py'
                    )}
                >
                    <Editor />
                    {script.meta.hasHistory && <CodeHistory />}
                </div>
                {script.lang === 'python' && <BrythonCommunicator />}
            </DocContext.Provider>
        </div>
    );
});

export default CodeEditorComponent;
