import { Cell, Signal, map } from '@mdxeditor/gurx';
import { Extension } from '@codemirror/state';
import {
    $isCodeBlockNode,
    activeEditor$,
    appendCodeBlockEditorDescriptor$,
    CodeBlockEditorDescriptor,
    createRootEditorSubscription$,
    insertCodeBlock$,
    realmPlugin
} from '@mdxeditor/editor';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import {
    $getSelection,
    $isElementNode,
    $isParagraphNode,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    KEY_DOWN_COMMAND,
    LexicalEditor
} from 'lexical';

/**
 * The codemirror code block languages.
 * @group CodeMirror
 */
export const codeBlockLanguages$ = Cell({
    js: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript (React)',
    jsx: 'JavaScript (React)',
    css: 'CSS'
});

/**
 * Inserts a new code mirror code block with the specified parameters.
 * @group CodeMirror
 */
export const insertCodeMirror$ = Signal<{ language: string; code: string }>((r) => {
    r.link(
        r.pipe(
            insertCodeMirror$,
            map(({ language, code }) => {
                return {
                    code: code,
                    language,
                    meta: ''
                };
            })
        ),
        insertCodeBlock$
    );
});

/**
 * The code mirror extensions for the coemirror code block editor.
 * @group CodeMirror
 */
export const codeMirrorExtensions$ = Cell<Extension[]>([]);

/**
 * Whether or not to try to dynamically load the code block language support.
 * Disable if you want to manually pass the supported languages.
 * @group CodeMirror
 */
export const codeMirrorAutoLoadLanguageSupport$ = Cell<boolean>(true);

/**
 * A plugin that adds lets users edit code blocks with CodeMirror.
 * @group CodeMirror
 */
export const codeMirrorPlugin = realmPlugin<{
    codeBlockLanguages: Record<string, string>;
    /**
     * Optional, additional CodeMirror extensions to load in the diff/source mode.
     */
    codeMirrorExtensions?: Extension[];
    /**
     * Whether or not to try to dynamically load the code block language support.
     * Disable if you want to manually pass the supported languages.
     * @group CodeMirror
     */
    autoLoadLanguageSupport?: boolean;
}>({
    update(r, params) {
        r.pubIn({
            [codeBlockLanguages$]: params?.codeBlockLanguages,
            [codeMirrorExtensions$]: params?.codeMirrorExtensions ?? [],
            [codeMirrorAutoLoadLanguageSupport$]: params?.autoLoadLanguageSupport ?? true
        });
    },

    init(r, params) {
        r.pubIn({
            [codeBlockLanguages$]: params?.codeBlockLanguages,
            [codeMirrorExtensions$]: params?.codeMirrorExtensions ?? [],
            [appendCodeBlockEditorDescriptor$]: buildCodeBlockDescriptor(params?.codeBlockLanguages ?? {}),
            [codeMirrorAutoLoadLanguageSupport$]: params?.autoLoadLanguageSupport ?? true,
            [createRootEditorSubscription$]: [
                (editor: LexicalEditor) => {
                    return editor.registerCommand<KeyboardEvent>(
                        KEY_DOWN_COMMAND,
                        (event, activeEditor) => {
                            if (event.key !== 'ArrowRight' && event.key !== 'ArrowDown') {
                                return false;
                            }
                            const selection = $getSelection();
                            if (!$isRangeSelection(selection)) {
                                return false;
                            }
                            const nodes = selection.getNodes();
                            const selectedNode = nodes[nodes.length - 1];
                            if (!selectedNode) {
                                return false;
                            }
                            const eNode =
                                $isElementNode(selectedNode) && !selectedNode.isInline()
                                    ? selectedNode
                                    : selectedNode.getParent();
                            const nextNode = eNode?.getNextSibling();
                            if ($isCodeBlockNode(nextNode)) {
                                event.preventDefault();
                                event.stopPropagation();
                                nextNode.select();
                                return true;
                            }
                            return false;
                        },
                        COMMAND_PRIORITY_LOW
                    );
                },
                (editor: LexicalEditor) => {
                    return editor.registerCommand<KeyboardEvent>(
                        KEY_DOWN_COMMAND,
                        (event, activeEditor) => {
                            if (
                                event.key !== 'ArrowLeft' &&
                                event.key !== 'ArrowUp' &&
                                event.key !== 'Backspace'
                            ) {
                                return false;
                            }
                            const selection = $getSelection();
                            if (!$isRangeSelection(selection)) {
                                return false;
                            }
                            const nodes = selection.getNodes();
                            const selectedNode = nodes[0];
                            if (!selectedNode) {
                                return false;
                            }
                            if (event.key !== 'ArrowUp' && selection.focus.offset !== 0) {
                                return false;
                            }
                            const eNode =
                                $isElementNode(selectedNode) && !selectedNode.isInline()
                                    ? selectedNode
                                    : selectedNode.getParent();

                            const prevNode = eNode?.getPreviousSibling();
                            if ($isCodeBlockNode(prevNode)) {
                                prevNode.select();
                                event.preventDefault();
                                event.stopPropagation();
                                return event.key !== 'Backspace';
                            }
                            return false;
                        },
                        COMMAND_PRIORITY_LOW
                    );
                }
            ]
        });
    }
});

function buildCodeBlockDescriptor(codeBlockLanguages: Record<string, string>): CodeBlockEditorDescriptor {
    return {
        match(language, meta) {
            const isLiveJSX = /live-jsx/i.test(meta ?? '');
            return !isLiveJSX;
        },
        priority: 1,
        Editor: CodeMirrorEditor
    };
}
