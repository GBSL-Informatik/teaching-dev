import { mdiRectangleOutline } from '@mdi/js';
import Icon from '@mdi/react';
import { activeEditor$, currentSelection$, MultipleChoiceToggleGroup } from '@mdxeditor/editor';
import { useCellValues } from '@mdxeditor/gurx';
import React from 'react';
import { $isBoxNode, TOGGLE_BOX_COMMAND } from './BoxNode';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';

const BoxIcon =
    'M17.042 15.8047c-.036-.102-.09-.2761-.12-.5342-.4021.4201-.8883.6302-1.4465.6302-.4982 0-.9123-.1441-1.2304-.4261-.3181-.2701-.4802-.6362-.4802-1.0744 0-.5282.1981-.9363.6002-1.2304.4021-.2941.9663-.4382 1.6986-.4382h.8403v-.3841c0-.2941-.09-.5282-.2701-.7022-.1801-.1741-.4502-.2581-.7983-.2581-.3121 0-.5702.072-.7803.2161-.2101.1501-.3121.3241-.3121.5342h-.8763c0-.2581.09-.5042.2701-.7443.1681-.2401.4261-.4261.7323-.5642.3061-.126.6362-.2101 1.0144-.2101.5882 0 1.0444.1441 1.3745.4382.3301.2941.5042.6962.5162 1.2124v2.3348c0 .4802.06.8523.1801 1.1284v.072H17.042m-1.4405-.6722c.2701 0 .5282-.066.7743-.1921.2401-.126.4201-.2941.5282-.4982v-.9423h-.6782c-1.0624 0-1.5966.2821-1.5966.8463 0 .2581.09.4382.2761.5762.1801.138.4081.2101.6962.2101M8.2789 13.2298h2.4429L9.5033 9.9766 8.2789 13.2298m.7082-4.6276h1.0324l2.827 7.2025H11.6881l-.5822-1.5425H7.8948l-.5762 1.5425H6.1602l2.827-7.2025ZM3.078 14.812c0 3.001 1.539 4.617 4.617 4.617h2.3085V17.89H7.695c-2.3085 0-3.078-.7695-3.078-3.078V12.5035H3.078V14.812m17.6985-4.617c0-3.001-1.539-4.617-4.617-4.617H13.851V7.117h2.3085c2.3085 0 3.078.7695 3.078 3.078v3.078h1.539V10.195m-4.617 9.234c3.078 0 4.617-1.539 4.617-4.617V13.273h-1.539v1.539c0 2.3085-.7695 3.078-3.078 3.078h-6.156v1.539h6.156M7.695 5.578c-3.078 0-4.617 1.539-4.617 4.617v2.3085H4.617V10.195c0-2.3085.7695-3.078 3.078-3.078h6.156V5.578H7.695Z';

/**
 * A toolbar component that lets the user undo and redo changes in the editor.
 * @group Toolbar Components
 */
export const ToolbarInsertBoxed: React.FC = () => {
    const [selection, editor] = useCellValues(currentSelection$, activeEditor$);
    const [isActive, setIsActive] = React.useState(false);
    React.useEffect(() => {
        scheduleMicrotask(() => {
            editor?.read(() => {
                try {
                    const parents = selection?.getNodes()?.[0]?.getParents() || [];
                    setIsActive(parents.some($isBoxNode));
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
                    title: 'Box einfügen',
                    disabled: false,
                    contents: (
                        <Icon
                            path={BoxIcon}
                            size={1}
                            color={isActive ? 'var(--ifm-color-blue)' : undefined}
                        />
                    ),
                    active: isActive,
                    onChange: () => {
                        editor?.dispatchCommand(TOGGLE_BOX_COMMAND, !isActive);
                    }
                }
            ]}
        />
    );
};
