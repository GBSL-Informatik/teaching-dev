import { mdiKeyboardOutline } from '@mdi/js';
import Icon from '@mdi/react';
import { activeEditor$, currentSelection$, MultipleChoiceToggleGroup } from '@mdxeditor/editor';
import { useCellValues } from '@mdxeditor/gurx';
import React from 'react';
import { $isKbdNode, TOGGLE_KBD_COMMAND } from './KbdNode';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';

/**
 * A toolbar component that lets the user undo and redo changes in the editor.
 * @group Toolbar Components
 */
export const ToolbarInsertKbd: React.FC = () => {
    const [selection, editor] = useCellValues(currentSelection$, activeEditor$);
    const [isActive, setIsActive] = React.useState(false);
    React.useEffect(() => {
        scheduleMicrotask(() => {
            editor?.read(() => {
                try {
                    const parents = selection?.getNodes()?.[0]?.getParents() || [];
                    setIsActive(parents.some($isKbdNode));
                } catch (e) {
                    // nop
                }
            });
        });
    }, [editor, selection]);
    return (
        <MultipleChoiceToggleGroup
            items={[
                {
                    title: isActive ? 'Tastenfeld aktiv' : 'Tastenfeld einfügen',
                    disabled: false,
                    contents: (
                        <Icon
                            path={mdiKeyboardOutline}
                            size={1}
                            color={isActive ? 'var(--ifm-color-blue)' : undefined}
                        />
                    ),
                    active: isActive,
                    onChange: () => {
                        editor?.dispatchCommand(TOGGLE_KBD_COMMAND, !isActive);
                    }
                }
            ]}
        />
    );
};
