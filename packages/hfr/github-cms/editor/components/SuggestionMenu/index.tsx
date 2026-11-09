import Icon from '@mdi/react';
import { useComputed } from '@tdev-hooks/useComputed';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type MdxDocument from '../../models/MdxDocument';
import {
    applySuggestion,
    availableSuggestions,
    selectedSuggestionIndex,
    suggestionMenuKey
} from '../../plugins/suggestionMenu';
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
 * The suggestions for the typed text (e.g. `/tip` or `:::`), below the text.
 * The keyboard is handled by the `suggestionMenu` plugin.
 */
const SuggestionMenu = observer(({ document, container }: Props) => {
    // null while the menu is closed, so typing does not re-render the menu
    const menu = useComputed(() => {
        const { typed, selectedIndex } = suggestionMenuKey.getState(document.state) ?? {};
        if (!typed) {
            return null;
        }
        return { typed, selectedIndex, suggestions: availableSuggestions(document.state, typed) };
    }, [document]);

    const view = document.view;
    if (!menu || menu.suggestions.length === 0 || !view || !container || document.showDiff) {
        return null;
    }

    const typedStart = view.coordsAtPos(menu.typed.from);
    const bounds = container.getBoundingClientRect();
    const position = { top: typedStart.bottom - bounds.top + GAP_PX, left: typedStart.left - bounds.left };
    const selectedIndex = selectedSuggestionIndex(menu.selectedIndex ?? 0, menu.suggestions.length);

    return (
        <div className={clsx(styles.menu)} style={position} role="listbox">
            {menu.suggestions.map((suggestion, index) => (
                <div
                    key={suggestion.label}
                    ref={index === selectedIndex ? scrollIntoView : undefined}
                    className={clsx(styles.item, index === selectedIndex && styles.selected)}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseDown={(event) => {
                        // keep the focus (and the selection) in the editor
                        event.preventDefault();
                        document.run(applySuggestion(menu.typed, suggestion));
                    }}
                >
                    <Icon path={suggestion.icon} size="1.1em" />
                    {suggestion.label}
                </div>
            ))}
        </div>
    );
});

export default SuggestionMenu;
