// https://github.com/mdx-editor/editor/blob/main/src/plugins/codemirror/CodeMirrorEditor.tsx
import { useCellValues } from '@mdxeditor/gurx';
import React from 'react';

import { languages } from '@codemirror/language-data';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { basicLight } from 'cm6-theme-basic-light';
import { basicSetup } from 'codemirror';
import { codeBlockLanguages$, codeMirrorAutoLoadLanguageSupport$, codeMirrorExtensions$ } from '.';
import { CodeBlockEditorProps, readOnly$, useCodeBlockEditorContext } from '@mdxeditor/editor';
import { useCodeMirrorRef } from './useCodeMirrorRef';
import styles from './styles.module.scss';
import Card from '@tdev-components/shared/Card';
import RemoveNode from '@tdev-components/Cms/MdxEditor/RemoveNode';
import clsx from 'clsx';
import GenericAttributeEditor, {
    GenericPropery,
    GenericValueProperty
} from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';
import { extractMetaProps, sanitizedTitle } from '@tdev/theme/CodeBlock';
import { v4 } from 'uuid';
import Badge from '@tdev-components/shared/Badge';
import Button from '@tdev-components/shared/Button';
import Popup from 'reactjs-popup';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import MyAttributes from '../../GenericAttributeEditor/MyAttributes';
import { action } from 'mobx';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';

export const COMMON_STATE_CONFIG_EXTENSIONS: Extension[] = [];

const LANGUAGE_ALIAS_MAP: { [key: string]: string } = {
    ['mdx-code-block']: 'tsx'
};

const DOCUSAURUS_LINE_HIGHLIGHT_REGEX = /^\{(\d|,|\.|-)+\}$/;

const PYTHON_PROPS: GenericPropery[] = [
    {
        name: 'live_py',
        type: 'checkbox',
        required: false,
        sideEffect: action((form) => {
            const livePy = form.find('live_py');
            const slim = form.find('slim');
            if (!livePy || !slim) {
                return;
            }
            if (livePy.checkboxValue) {
                const id = form.find('id');
                form.setValue('id', id?._pristine || v4());
            } else {
                form.resetField('slim', true);
                form.resetField('id', true);
            }
        })
    },
    {
        name: 'slim',
        type: 'checkbox',
        required: false,
        sideEffect: (form) => {
            const livePy = form.find('live_py');
            const slim = form.find('slim');
            if (!livePy || !slim) {
                return;
            }
            if (livePy.checkboxValue && slim.checkboxValue && !form.find('id')) {
                return;
            }
            if (slim.checkboxValue) {
                form.setValue('live_py', 'true');
                form.resetField('id', true);
            } else {
                if (livePy.checkboxValue) {
                    const id = form.find('id');
                    form.setValue('id', id?._pristine || v4());
                }
            }
        }
    },
    {
        name: 'id',
        type: 'text',
        required: false,
        sideEffect: (form) => {
            const livePy = form.find('live_py');
            const slim = form.find('slim');
            if (!livePy || !slim) {
                return;
            }
            if (form.find('id')) {
                slim.resetValue(true);
                livePy.setValue('true');
            } else {
                slim.setValue('true');
            }
        },
        resettable: true,
        generateNewValue: () => {
            return v4();
        }
    },
    { name: 'readonly', type: 'checkbox', required: false },
    { name: 'noDownload', type: 'checkbox', required: false },
    { name: 'noReset', type: 'checkbox', required: false },
    { name: 'noCompare', type: 'checkbox', required: false },
    {
        name: 'hideWarning',
        type: 'checkbox',
        required: false,
        description: 'Warnung, dass Dokument nicht gespeichert wird, verstecken.'
    },
    {
        name: 'versioned',
        type: 'checkbox',
        required: false,
        description: 'Jede Sekunde eine Version abspeichern.'
    },
    {
        name: 'noHistory',
        type: 'checkbox',
        required: false,
        description: 'Versionshistory verstecken'
    },
    {
        name: 'maxLines',
        type: 'number',
        required: false,
        description: 'Maximale Anzahl Zeilen bevor gescrollt wird.'
    }
];

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter, meta }: CodeBlockEditorProps) => {
    const mappedLang = LANGUAGE_ALIAS_MAP[language] || language;
    const { setCode, parentEditor, lexicalNode } = useCodeBlockEditorContext();
    const [readOnly, codeMirrorExtensions, autoLoadLanguageSupport, codeBlockLanguages] = useCellValues(
        readOnly$,
        codeMirrorExtensions$,
        codeMirrorAutoLoadLanguageSupport$,
        codeBlockLanguages$
    );
    const codeMirrorRef = useCodeMirrorRef('codeblock', language, focusEmitter);
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
    const metaProps = React.useMemo(() => {
        const mProps = extractMetaProps({ metastring: meta });
        return Object.entries(mProps).reduce<Record<string, string>>((acc, [key, value]) => {
            if (DOCUSAURUS_LINE_HIGHLIGHT_REGEX.test(key)) {
                acc['highlightedLines'] = key.substring(1, key.length - 1);
            } else if (typeof value === 'boolean') {
                acc[key] = value ? 'true' : 'false';
            } else if (key === 'title') {
                acc[key] = `${value}`.replace(/(^")|("$)/g, '');
            } else {
                acc[key] = `${value}`;
            }
            return acc;
        }, {});
    }, [meta]);

    const onUpdate = React.useCallback(
        (values: GenericValueProperty[]) => {
            const updatedVals = values.reduce<Record<string, string>>((acc, prop) => {
                acc[prop.name] = prop.value;
                return acc;
            }, {});
            const metaString = Object.entries({ ...metaProps, ...updatedVals }).reduce<string>(
                (acc, [key, value]) => {
                    if (value === '' || !value || value === 'false') {
                        return acc;
                    }
                    if (value === 'true') {
                        return `${acc} ${key}`.trim();
                    }
                    if (key === 'title') {
                        return `${acc} title="${value}"`.trim();
                    }
                    if (key === 'highlightedLines') {
                        return `${acc} {${value}}`.trim();
                    }
                    return `${acc} ${key}=${value}`.trim();
                },
                ''
            );
            parentEditor.update(() => {
                lexicalNode.setMeta(metaString);
                scheduleMicrotask(() => {
                    parentEditor.update(() => {
                        lexicalNode.getLatest().select();
                    });
                });
            });
        },
        [metaProps, parentEditor, lexicalNode]
    );

    const properties = React.useMemo<GenericPropery[]>(() => {
        const props: GenericPropery[] = [
            { name: 'title', type: 'text', required: false, placeholder: 'Title' }
        ];
        if (['python', 'py', 'mpy'].includes(language)) {
            props.push(...PYTHON_PROPS);
        } else {
            props.push({ name: 'highlightedLines', type: 'text', required: false, placeholder: '1,4-6,9' });
            props.push({ name: 'showLineNumbers', type: 'checkbox', required: false });
        }
        return props;
    }, [language]);

    return (
        <Card
            classNames={{
                card: styles.editor,
                header: styles.toolbar
            }}
            header={
                <>
                    <div className={clsx(styles.actions)}>
                        <Popup
                            trigger={
                                <div>
                                    <Badge color="blue">{language || '-'}</Badge>
                                </div>
                            }
                            on={['click', 'hover']}
                            keepTooltipInside="#__docusaurus"
                            position={['bottom left', 'top left', 'left center']}
                            closeOnDocumentClick
                            lockScroll
                            closeOnEscape
                        >
                            <Card classNames={{ body: styles.languagePopup }}>
                                {[['', '-'], ...Object.entries(codeBlockLanguages)].map(
                                    ([value, label], idx) => {
                                        return (
                                            <Button
                                                key={idx}
                                                text={label}
                                                color={value === language ? 'blue' : undefined}
                                                onClick={() => {
                                                    parentEditor.update(() => {
                                                        lexicalNode.setLanguage(value);
                                                        scheduleMicrotask(() => {
                                                            parentEditor.update(() => {
                                                                lexicalNode.getLatest().select();
                                                            });
                                                        });
                                                    });
                                                }}
                                            />
                                        );
                                    }
                                )}
                            </Card>
                        </Popup>
                        <GenericAttributeEditor
                            onUpdate={onUpdate}
                            properties={properties}
                            values={metaProps}
                            title="Eigenschaften"
                        />
                    </div>
                    <MyAttributes
                        className={clsx(styles.props)}
                        attributes={metaProps}
                        skippedAttributes={['title']}
                        copyableAttributes={['id']}
                    />
                    {metaProps.title && (
                        <h4>{sanitizedTitle(metaProps.title.replace(/^"/, '').replace(/"$/, ''))}</h4>
                    )}
                    <div className={clsx(styles.actions)}>
                        <RemoveNode
                            buttonClassName={clsx(styles.removeButton)}
                            onRemove={() => {
                                parentEditor.update(() => {
                                    lexicalNode.remove();
                                });
                            }}
                            size={SIZE_S}
                        />
                    </div>
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
