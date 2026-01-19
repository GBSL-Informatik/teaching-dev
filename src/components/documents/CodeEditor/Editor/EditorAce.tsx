import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/webpack-resolver';
import 'ace-builds/esm-resolver';
import { observer } from 'mobx-react-lite';
import useCodeTheme from '@tdev-hooks/useCodeTheme';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';

const ALIAS_LANG_MAP_ACE = {
    mpy: 'python',
    py: 'python'
};

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const EditorAce = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const eRef = React.useRef<AceEditor>(null);
    const { aceTheme } = useCodeTheme();
    React.useEffect(() => {
        if (eRef && eRef.current) {
            const node = eRef.current;
            if (code.lang === 'python') {
                node.editor.commands.addCommand({
                    // commands is array of key bindings.
                    name: 'execute',
                    bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
                    exec: () => code.runCode()
                });
            }
            node.editor.commands.addCommand({
                // commands is array of key bindings.
                name: 'save',
                bindKey: { win: 'Ctrl-s', mac: 'Command-s' },
                exec: () => {
                    code.saveNow();
                }
            });
            return () => {
                if (node && node.editor) {
                    const cmd = node.editor.commands.commands['execute'];
                    if (cmd) {
                        node.editor.commands.removeCommand(cmd, true);
                    }
                    const save = node.editor.commands.commands['save'];
                    if (save) {
                        node.editor.commands.removeCommand(save, true);
                    }
                }
            };
        }
    }, [eRef, code]);

    return (
        <div className={clsx(styles.editor)}>
            <AceEditor
                className={clsx(styles.brythonEditor, !code.meta.showLineNumbers && styles.noGutter)}
                style={{
                    width: '100%',
                    lineHeight: 'var(--ifm-pre-line-height)',
                    fontSize: 'var(--ifm-code-font-size)',
                    fontFamily: 'var(--ifm-font-family-monospace)'
                }}
                fontSize={'var(--ifm-code-font-size)'}
                onPaste={() => {
                    if (code.meta.versioned) {
                        /**
                         * Save immediately as pasted content
                         */
                        code.setIsPasted(true);
                    }
                }}
                focus={false}
                navigateToFileEnd={false}
                minLines={code.meta.minLines}
                maxLines={code.meta.maxLines}
                ref={eRef}
                mode={ALIAS_LANG_MAP_ACE[code.lang as keyof typeof ALIAS_LANG_MAP_ACE] ?? code.lang}
                theme={code.meta.theme ?? aceTheme}
                onChange={(value: string, e: { action: 'insert' | 'remove' }) => {
                    code.setCode(value, e.action);
                }}
                readOnly={code.meta.readonly || code.showRaw}
                value={code.showRaw ? code.pristineCode : code.code}
                defaultValue={code?.code || '\n'}
                name={code.codeId}
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
                showGutter={code.meta.showLineNumbers}
            />
        </div>
    );
});
export default EditorAce;
