import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { DOM_ELEMENT_IDS } from '@tdev-components/documents/CodeEditor/constants';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/webpack-resolver';
import 'ace-builds/esm-resolver';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { DocumentType } from '@tdev-api/document';
import { observer } from 'mobx-react-lite';

const ALIAS_LANG_MAP_ACE = {
    mpy: 'python',
    py: 'python'
};

const EditorAce = observer(() => {
    const script = useDocument<DocumentType.Script>();
    const eRef = React.useRef<AceEditor>(null);
    React.useEffect(() => {
        if (eRef && eRef.current) {
            const node = eRef.current;
            if (script.lang === 'python') {
                node.editor.commands.addCommand({
                    // commands is array of key bindings.
                    name: 'execute',
                    bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
                    exec: () => script.execScript()
                });
            }
            node.editor.commands.addCommand({
                // commands is array of key bindings.
                name: 'save',
                bindKey: { win: 'Ctrl-s', mac: 'Command-s' },
                exec: () => {
                    script.saveNow();
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
    }, [eRef, script]);

    return (
        <div className={clsx(styles.editor)}>
            <AceEditor
                className={clsx(styles.brythonEditor, !script.meta.showLineNumbers && styles.noGutter)}
                style={{
                    width: '100%',
                    lineHeight: 'var(--ifm-pre-line-height)',
                    fontSize: 'var(--ifm-code-font-size)',
                    fontFamily: 'var(--ifm-font-family-monospace)'
                }}
                fontSize={'var(--ifm-code-font-size)'}
                onPaste={() => {
                    if (script.meta.versioned) {
                        /**
                         * Save immediately as pasted content
                         */
                        script.setIsPasted(true);
                    }
                }}
                focus={false}
                navigateToFileEnd={false}
                minLines={script.meta.minLines}
                maxLines={script.meta.maxLines}
                ref={eRef}
                mode={ALIAS_LANG_MAP_ACE[script.lang as keyof typeof ALIAS_LANG_MAP_ACE] ?? script.lang}
                theme={script.meta.theme ?? 'dracula'}
                onChange={(value: string, e: { action: 'insert' | 'remove' }) => {
                    script.setCode(value, e.action);
                }}
                readOnly={script.meta.readonly || script.showRaw}
                value={script.showRaw ? script.pristineCode : script.code}
                defaultValue={script?.code || '\n'}
                name={DOM_ELEMENT_IDS.aceEditor(script.codeId)}
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
                showGutter={script.meta.showLineNumbers}
            />
        </div>
    );
});
export default EditorAce;
