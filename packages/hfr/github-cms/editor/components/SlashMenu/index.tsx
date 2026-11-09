import Icon from '@mdi/react';
import { useComputed } from '@tdev-hooks/useComputed';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type MdxDocument from '../../models/MdxDocument';
import {
    applyQuickAction,
    availableQuickActions,
    selectedQuickActionIndex,
    slashMenuKey
} from '../../plugins/slashMenu';
import styles from './styles.module.scss';

interface Props {
    document: MdxDocument;
    /** the element the editor is mounted in, the menu is positioned relative to it */
    container: HTMLElement | null;
}

const GAP_PX = 4;

const scrollIntoView = (element: HTMLElement | null) => {
    element?.scrollIntoView({ block: 'nearest' });
};

/**
 * The quick actions of the typed `/query`, below the slash.
 * The keyboard is handled by the `slashMenu` plugin.
 */
const SlashMenu = observer(({ document, container }: Props) => {
    // null while the menu is closed, so typing does not re-render the menu
    const menu = useComputed(() => {
        const { query, selectedIndex } = slashMenuKey.getState(document.state) ?? {};
        if (!query) {
            return null;
        }
        return { query, selectedIndex, actions: availableQuickActions(document.state, query) };
    }, [document]);

    const view = document.view;
    if (!menu || menu.actions.length === 0 || !view || !container || document.showDiff) {
        return null;
    }

    const slash = view.coordsAtPos(menu.query.from);
    const bounds = container.getBoundingClientRect();
    const position = { top: slash.bottom - bounds.top + GAP_PX, left: slash.left - bounds.left };
    const selectedIndex = selectedQuickActionIndex(menu.selectedIndex ?? 0, menu.actions.length);

    return (
        <div className={clsx(styles.menu)} style={position} role="listbox">
            {menu.actions.map((action, index) => (
                <div
                    key={action.label}
                    ref={index === selectedIndex ? scrollIntoView : undefined}
                    className={clsx(styles.item, index === selectedIndex && styles.selected)}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseDown={(event) => {
                        // keep the focus (and the selection) in the editor
                        event.preventDefault();
                        document.run(applyQuickAction(menu.query, action));
                    }}
                >
                    <Icon path={action.icon} size="1.1em" />
                    {action.label}
                </div>
            ))}
        </div>
    );
});

export default SlashMenu;
