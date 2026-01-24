import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/mode-plain_text';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/mode-svg';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/webpack-resolver';
import 'ace-builds/esm-resolver';
import useCodeTheme from '@tdev-hooks/useCodeTheme';
import { observer } from 'mobx-react-lite';

const ALIAS_LANG_MAP_ACE = {
    mpy: 'python',
    py: 'python',
    ts: 'typescript',
    mdx: 'markdown',
    md: 'markdown'
};

interface Props {
    defaultValue?: string;
    className?: string;
    aceClassName?: string;
    lang?: string;
    onChange?: (code: string) => void;
    value?: string;
    focus?: boolean;
    maxLines?: number;
    readonly?: boolean;
    name?: string;
    placeholder?: string;
    hideLineNumbers?: boolean;
    onInit?: (editor: AceEditor) => ReturnType<React.EffectCallback>;
}

const CodeEditor = observer((props: Props) => {
    const ref = React.useRef<AceEditor>(null);
    const { aceTheme } = useCodeTheme();
    React.useEffect(() => {
        if (props.value !== undefined && ref.current) {
            const val = ref.current.editor.getValue();
            if (props.value !== val) {
                ref.current.editor.setValue(props.value);
            }
            if (!ref.current.editor.getSelection().isEmpty()) {
                ref.current.editor.clearSelection();
            }
        }
    }, [ref, props.value]);
    React.useEffect(() => {
        if (ref && ref.current) {
            return props.onInit?.(ref.current);
        }
    }, [ref]);
    return (
        <div className={clsx(styles.editor, props.className)}>
            <AceEditor
                className={clsx(styles.ace, props.aceClassName)}
                style={{
                    width: '100%',
                    lineHeight: 'var(--ifm-pre-line-height)',
                    fontSize: 'var(--ifm-code-font-size)',
                    fontFamily: 'var(--ifm-font-family-monospace)'
                }}
                ref={ref}
                fontSize={'var(--ifm-code-font-size)'}
                focus={!!props.focus}
                navigateToFileEnd={false}
                maxLines={props.maxLines || 20}
                mode={
                    ALIAS_LANG_MAP_ACE[props.lang as keyof typeof ALIAS_LANG_MAP_ACE] ??
                    (props.lang || 'plain_text')
                }
                theme={aceTheme}
                onChange={(value: string, e: { action: 'insert' | 'remove' }) => {
                    props.onChange?.(value);
                }}
                readOnly={props.readonly}
                value={props.value}
                defaultValue={props.defaultValue ?? '\n'}
                name={props.name}
                editorProps={{ $blockScrolling: true }}
                placeholder={props.placeholder}
                setOptions={{
                    displayIndentGuides: true,
                    vScrollBarAlwaysVisible: false,
                    highlightGutterLine: false
                }}
                showPrintMargin={false}
                highlightActiveLine={false}
                enableBasicAutocompletion
                enableLiveAutocompletion={false}
                enableSnippets={false}
                showGutter={!props.hideLineNumbers}
            />
        </div>
    );
});
export default CodeEditor;
