import clsx from 'clsx';
import { type ReactNode } from 'react';

import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

interface Props {
    children: ReactNode;
    className?: string;
    gridTemplateColumns?: string;
    small?: boolean;
    compact?: boolean;
    ignoreMediaQueries?: boolean;
}

const DefinitionList = observer((props: Props) => {
    return (
        <dl
            className={clsx(
                styles.definitionList,
                props.className,
                props.gridTemplateColumns && styles.ignoreMediaQueries,
                props.compact && styles.compact,
                props.small && styles.small,
                props.ignoreMediaQueries && styles.ignoreMediaQueries
            )}
            style={{ gridTemplateColumns: props.gridTemplateColumns }}
        >
            {props.children}
        </dl>
    );
});

export default DefinitionList;
