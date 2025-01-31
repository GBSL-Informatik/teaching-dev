import { mergeRegister } from '@lexical/utils';
import { mdiFormatTextbox, mdiRectangleOutline, mdiShapeRectanglePlus } from '@mdi/js';
import Icon from '@mdi/react';
import {
    activeEditor$,
    applyFormat$,
    currentFormat$,
    currentSelection$,
    insertDecoratorNode$,
    MultipleChoiceToggleGroup
} from '@mdxeditor/editor';
import { useCellValues, usePublisher, withLatestFrom } from '@mdxeditor/gurx';
import {
    $isRangeSelection,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    IS_BOLD,
    REDO_COMMAND,
    UNDO_COMMAND
} from 'lexical';
import React from 'react';
import { FORMAT_BOX_COMMAND, FORMAT_BOXED } from '.';
import { $createBoxNode, $isBoxNode, TOGGLE_BOXED_COMMAND } from './BoxNode';

/**
 * A toolbar component that lets the user undo and redo changes in the editor.
 * @group Toolbar Components
 */
export const ToolbarInsertBoxed: React.FC = () => {
    const [selection, editor] = useCellValues(currentSelection$, activeEditor$);
    const [isActive, setIsActive] = React.useState(false);
    React.useLayoutEffect(() => {
        editor?.read(() => {
            try {
                const parents = selection?.getNodes()?.[0]?.getParents() || [];
                setIsActive(parents.some($isBoxNode));
            } catch (e) {
                // nop
            }
        });
    }, [editor, selection]);
    return (
        <MultipleChoiceToggleGroup
            items={[
                {
                    title: 'Box',
                    disabled: false,
                    contents: (
                        <Icon
                            path={mdiRectangleOutline}
                            size={1}
                            color={isActive ? 'var(--ifm-color-blue)' : undefined}
                        />
                    ),
                    active: isActive,
                    onChange: () => {
                        editor?.dispatchCommand(TOGGLE_BOXED_COMMAND, !isActive);
                    }
                }
            ]}
        />
    );
};
