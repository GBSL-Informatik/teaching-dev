// https://github.com/mdx-editor/editor/blob/main/src/plugins/codemirror/CodeMirrorEditor.tsx
import { useCellValues } from '@mdxeditor/gurx';
import React from 'react';

import { languages } from '@codemirror/language-data';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { basicLight } from 'cm6-theme-basic-light';
import { basicSetup } from 'codemirror';
import { codeBlockLanguages$, codeMirrorAutoLoadLanguageSupport$, codeMirrorExtensions$ } from '.';
import {
    CodeBlockEditorProps,
    iconComponentFor$,
    readOnly$,
    Select,
    useCodeBlockEditorContext,
    useTranslation
} from '@mdxeditor/editor';
import { useCodeMirrorRef } from './useCodeMirrorRef';
import styles from './styles.module.scss';
import Card from '@tdev-components/shared/Card';
import RemoveJsxNode from '@tdev-components/Cms/MdxEditor/RemoveJsxNode';
import clsx from 'clsx';

export const COMMON_STATE_CONFIG_EXTENSIONS: Extension[] = [];
const EMPTY_VALUE = '__EMPTY_VALUE__';

const LANGUAGE_ALIAS_MAP: { [key: string]: string } = {
    ['mdx-code-block']: 'tsx'
};

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter }: CodeBlockEditorProps) => {
    const mappedLang = LANGUAGE_ALIAS_MAP[language] || language;
    const t = useTranslation();
    const { parentEditor, lexicalNode } = useCodeBlockEditorContext();
    const [readOnly, codeMirrorExtensions, autoLoadLanguageSupport, codeBlockLanguages] = useCellValues(
        readOnly$,
        codeMirrorExtensions$,
        codeMirrorAutoLoadLanguageSupport$,
        codeBlockLanguages$
    );

    const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock', language, focusEmitter);
    const { setCode } = useCodeBlockEditorContext();
    const editorViewRef = React.useRef<EditorView | null>(null);
    const elRef = React.useRef<HTMLDivElement | null>(null);

    const setCodeRef = React.useRef(setCode);
    setCodeRef.current = setCode;
    codeMirrorRef.current = {
        getCodemirror: () => editorViewRef.current!
    };

    React.useEffect(() => {
        void (async () => {
            const extensions = [
                ...codeMirrorExtensions,
                basicSetup,
                basicLight,
                lineNumbers(),
                EditorView.lineWrapping,
                EditorView.updateListener.of(({ state }) => {
                    setCodeRef.current(state.doc.toString());
                })
            ];
            if (readOnly) {
                extensions.push(EditorState.readOnly.of(true));
            }
            if (language !== '' && autoLoadLanguageSupport) {
                const languageData = languages.find((l) => {
                    return (
                        l.name === mappedLang ||
                        l.alias.includes(mappedLang) ||
                        l.extensions.includes(mappedLang)
                    );
                });
                if (languageData) {
                    try {
                        const languageSupport = await languageData.load();
                        extensions.push(languageSupport.extension);
                    } catch (e) {
                        console.warn('failed to load language support for', language);
                    }
                }
            }
            elRef.current!.innerHTML = '';
            editorViewRef.current = new EditorView({
                parent: elRef.current!,
                state: EditorState.create({ doc: code, extensions })
            });
        })();
        return () => {
            editorViewRef.current?.destroy();
            editorViewRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [readOnly, language]);

    return (
        <Card
            classNames={{
                card: styles.editor,
                header: styles.toolbar
            }}
            header={
                <>
                    <Select
                        value={language}
                        onChange={(language) => {
                            parentEditor.update(() => {
                                lexicalNode.setLanguage(language === EMPTY_VALUE ? '' : language);
                                setTimeout(() => {
                                    parentEditor.update(() => {
                                        lexicalNode.getLatest().select();
                                    });
                                });
                            });
                        }}
                        triggerTitle={t('codeBlock.selectLanguage', 'Select code block language')}
                        placeholder={t('codeBlock.inlineLanguage', 'Language')}
                        items={Object.entries(codeBlockLanguages).map(([value, label]) => ({
                            value: value ? value : EMPTY_VALUE,
                            label
                        }))}
                    />
                    <RemoveJsxNode
                        buttonClassName={clsx(styles.removeButton)}
                        onRemove={() => {
                            parentEditor.update(() => {
                                lexicalNode.remove();
                            });
                        }}
                    />
                </>
            }
        >
            <div
                onKeyDown={(e) => {
                    e.stopPropagation();
                }}
            >
                <div ref={elRef} />
            </div>
        </Card>
    );
};
