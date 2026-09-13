import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { CodeType } from '@tdev-api/document';
import type { Overrides } from '@tdev-components/documents/CodeEditor/Editor/EditorAce';
import useCodeTheme from '@tdev-hooks/useCodeTheme';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { FullscreenContext } from '@tdev-hooks/useFullscreenTargetId';
import { useStore } from '@tdev-hooks/useStore';
import iCode from '@tdev-models/documents/iCode';
import { LiveCode } from '@tdev-stores/ComponentStore';
import { MetaProps } from '@tdev/theme/CodeBlock';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import CodeHistory from './CodeHistory';
import Editor from './Editor';
import styles from './styles.module.scss';

export interface Props extends Omit<MetaProps, 'live_jsx' | 'live_py'> {
    title: string;
    liveCodeType?: LiveCode;
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
    const componentStore = useStore('componentStore');
    const [type] = React.useState(componentStore.matchCodeBlockType(props.liveCodeType));
    const [meta] = React.useState(componentStore.createEditorMeta(type, props));
    const code = useFirstMainDocument(id, meta, true, {}, meta.versioned ? meta.type : undefined);
    React.useEffect(() => {
        if (code && code.meta?.slim) {
            code.setCode(props.code);
        }
    }, [code, props.code]);
    if (!ExecutionEnvironment.canUseDOM || !code) {
        return <CodeBlock language={props.lang}>{props.code}</CodeBlock>;
    }
    return (
        <CodeEditorComponent
            code={code as iCode<typeof type>}
            className={props.className}
            // We force remount the editor on hydration,
            // otherwise the correct language mode might not be applied
            key={String(code.lang)}
        />
    );
});

export interface ScriptProps<T extends CodeType> {
    code: iCode<T>;
    className?: string;
    isPresentation?: boolean;
    overrides?: Overrides;
}

const CodeEditorComponent = observer(<T extends CodeType>(props: ScriptProps<T>) => {
    const { code } = props;
    const { colorMode } = useCodeTheme();
    const viewStore = useStore('viewStore');
    const id = React.useId();
    if (!props.isPresentation && code.isPresenting) {
        return null;
    }
    return (
        <FullscreenContext.Provider value={id}>
            <div
                id={id}
                className={clsx(
                    styles.wrapper,
                    'notranslate',
                    props.className,
                    viewStore.isFullscreenTarget(id) && styles.fullscreen
                )}
            >
                <div
                    className={clsx(
                        styles.editorContainer,
                        colorMode === 'light' && styles.lightTheme,
                        code.meta.slim ? styles.containerSlim : styles.containerBig,
                        'live-code-editor'
                    )}
                >
                    <Editor code={code} overrides={props.overrides} />
                    {code.meta.hasHistory && <CodeHistory code={code} />}
                </div>
            </div>
        </FullscreenContext.Provider>
    );
});

export default CodeEditorComponent;
