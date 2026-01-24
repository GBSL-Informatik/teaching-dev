import * as React from 'react';
import styles from './styles.module.scss';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Editor from './Editor';
import CodeHistory from './CodeHistory';
import { MetaProps } from '@tdev/theme/CodeBlock';
import { observer } from 'mobx-react-lite';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import useCodeTheme from '@tdev-hooks/useCodeTheme';
import iCode from '@tdev-models/documents/iCode';
import { CodeType } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';
import { LiveCode } from '@tdev-stores/ComponentStore';
import useFullscreenChange, { FullscreenContext } from '@tdev-hooks/useFullscreen';

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
}

const CodeEditorComponent = observer(<T extends CodeType>(props: ScriptProps<T>) => {
    const { code } = props;
    const { colorMode } = useCodeTheme();
    const id = React.useId();
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const onFullscreenChange = React.useCallback((isFullscreen: boolean) => {
        setIsFullscreen(isFullscreen);
    }, []);
    const { requestFullscreen } = useFullscreenChange(id, onFullscreenChange);
    return (
        <FullscreenContext.Provider value={isFullscreen}>
            <div
                id={id}
                className={clsx(
                    styles.wrapper,
                    'notranslate',
                    props.className,
                    isFullscreen && styles.fullscreen
                )}
            >
                <div
                    className={clsx(
                        styles.playgroundContainer,
                        colorMode === 'light' && styles.lightTheme,
                        code.meta.slim ? styles.containerSlim : styles.containerBig,
                        'live-code-editor'
                    )}
                >
                    <Editor code={code} onRequestFullscreen={requestFullscreen} />
                    {code.meta.hasHistory && <CodeHistory code={code} />}
                </div>
            </div>
        </FullscreenContext.Provider>
    );
});

export default CodeEditorComponent;
