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

const ALIAS_LANG_MAP_ACE = {
    mpy: 'python',
    py: 'python'
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
}

const CodeEditor = (props: Props) => {
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
                fontSize={'var(--ifm-code-font-size)'}
                focus={!!props.focus}
                navigateToFileEnd={false}
                maxLines={props.maxLines || 20}
                mode={
                    ALIAS_LANG_MAP_ACE[props.lang as keyof typeof ALIAS_LANG_MAP_ACE] ??
                    (props.lang || 'plain_text')
                }
                theme="dracula"
                onChange={(value: string, e: { action: 'insert' | 'remove' }) => {
                    props.onChange?.(value);
                }}
                readOnly={props.readonly}
                value={props.value}
                defaultValue={props.defaultValue || '\n'}
                name={props.name}
                editorProps={{ $blockScrolling: true }}
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
                showGutter={true}
            />
        </div>
    );
};
export default CodeEditor;
