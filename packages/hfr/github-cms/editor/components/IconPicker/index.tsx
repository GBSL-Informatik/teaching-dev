import Icon from '@mdi/react';
import clsx from 'clsx';
import React from 'react';
import Combobox from '../Combobox';
import { type MdiIcon, mdiPath, searchIcons } from './mdiIcons';
import styles from './styles.module.scss';

interface Props {
    /** the name of the selected icon, e.g. `keyboard-return` */
    value: string;
    onSelect: (name: string) => void;
}

const iconName = (icon: MdiIcon) => icon.name;

const renderIcon = (icon: MdiIcon) => (
    <>
        <Icon path={icon.path} size={1.1} />
        <span className={clsx(styles.name)}>{icon.name}</span>
    </>
);

/**
 * Searches and selects an mdi icon. Typing the exact name of an icon and pressing enter selects it too.
 */
const IconPicker = (props: Props) => {
    const [query, setQuery] = React.useState(props.value);
    const results = React.useMemo(() => searchIcons(query), [query]);
    const selectedPath = mdiPath(props.value);

    const handleSelect = (icon: MdiIcon) => {
        setQuery(icon.name);
        props.onSelect(icon.name);
    };

    const handleEnter = () => {
        const exactMatch = results.find((icon) => icon.name === query.trim());
        if (exactMatch) {
            handleSelect(exactMatch);
        }
    };

    return (
        <div className={clsx(styles.picker)}>
            <span className={clsx(styles.selected)}>
                {selectedPath && <Icon path={selectedPath} size={1} />}
            </span>
            <Combobox
                value={query}
                options={results}
                optionKey={iconName}
                renderOption={renderIcon}
                isCurrent={(icon) => icon.name === props.value}
                layout="grid"
                placeholder="Icon suchen..."
                emptyText="Kein Icon gefunden"
                className={clsx(styles.input)}
                onChange={setQuery}
                onSelect={handleSelect}
                onEnter={handleEnter}
            />
        </div>
    );
};

export default IconPicker;
