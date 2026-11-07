import Icon from '@mdi/react';
import clsx from 'clsx';
import React from 'react';
import { useFloatingPlacement } from '../useFloatingPlacement';
import { type MdiIcon, mdiPath, searchIcons } from './mdiIcons';
import styles from './styles.module.scss';

interface Props {
    /** the name of the selected icon, e.g. `keyboard-return` */
    value: string;
    onSelect: (name: string) => void;
}

/**
 * Searches and selects an mdi icon. Icons are selected by clicking them or with
 * the arrow keys and enter. Typing the exact name of an icon and pressing enter selects it too.
 * The dropdown is centered below the input, or above it when there is not enough space below.
 */
const IconPicker = (props: Props) => {
    const [query, setQuery] = React.useState(props.value);
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlighted, setHighlighted] = React.useState(0);
    const [input, setInput] = React.useState<HTMLInputElement | null>(null);
    const [dropdown, setDropdown] = React.useState<HTMLDivElement | null>(null);
    const placement = useFloatingPlacement(input, isOpen ? dropdown : null);
    const results = React.useMemo(() => searchIcons(query), [query]);
    const selectedPath = mdiPath(props.value);

    const handleSelect = (icon: MdiIcon) => {
        setQuery(icon.name);
        setIsOpen(false);
        props.onSelect(icon.name);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
        setHighlighted(0);
        setIsOpen(true);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                setIsOpen(true);
                setHighlighted((idx) => Math.min(idx + 1, results.length - 1));
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                setHighlighted((idx) => Math.max(idx - 1, 0));
                break;
            case 'Enter':
                event.preventDefault();
                const exactMatch = results.find((icon) => icon.name === query.trim());
                const icon = isOpen ? results[highlighted] : exactMatch;
                if (icon) {
                    handleSelect(icon);
                }
                break;
            case 'Escape':
                if (isOpen) {
                    // close the dropdown only, not the surrounding popover
                    event.stopPropagation();
                    setIsOpen(false);
                }
                break;
        }
    };

    return (
        <div className={clsx(styles.picker)}>
            <span className={clsx(styles.selected)}>
                {selectedPath && <Icon path={selectedPath} size={1} />}
            </span>
            <input
                ref={setInput}
                className={clsx(styles.input)}
                value={query}
                placeholder="Icon suchen..."
                spellCheck={false}
                autoFocus
                role="combobox"
                aria-expanded={isOpen}
                onChange={handleChange}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setIsOpen(false)}
                onKeyDown={handleKeyDown}
            />
            {isOpen && (
                <div
                    ref={setDropdown}
                    role="listbox"
                    className={clsx(styles.dropdown, !placement && styles.measuring)}
                    style={placement ?? undefined}
                >
                    {results.length === 0 && <div className={clsx(styles.empty)}>Kein Icon gefunden</div>}
                    {results.map((icon, idx) => (
                        <button
                            key={icon.name}
                            type="button"
                            role="option"
                            aria-selected={idx === highlighted}
                            title={icon.name}
                            className={clsx(
                                styles.option,
                                idx === highlighted && styles.highlighted,
                                icon.name === props.value && styles.current
                            )}
                            // keep the focus in the input, otherwise the dropdown closes before the click
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setHighlighted(idx)}
                            onClick={() => handleSelect(icon)}
                        >
                            <Icon path={icon.path} size={1.1} />
                            <span className={clsx(styles.name)}>{icon.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default IconPicker;
