import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { Access } from '@tdev-api/document';
import Icon from '@mdi/react';
import { mdiCircleSmall } from '@mdi/js';

export const AccessNames: { [key in Access]: string } = {
    [Access.RO_User]: 'RO',
    [Access.RO_StudentGroup]: 'RO',
    [Access.RO_DocumentRoot]: 'RO',
    [Access.RW_User]: 'RW',
    [Access.RW_StudentGroup]: 'RW',
    [Access.RW_DocumentRoot]: 'RW',
    [Access.None_User]: 'None',
    [Access.None_StudentGroup]: 'None',
    [Access.None_DocumentRoot]: 'None'
};

export const AccessLevels = new Map<Access, number>([
    [Access.None_DocumentRoot, 0],
    [Access.RO_DocumentRoot, 1],
    [Access.RW_DocumentRoot, 2],
    [Access.None_StudentGroup, 0],
    [Access.RO_StudentGroup, 1],
    [Access.RW_StudentGroup, 2],
    [Access.None_User, 0],
    [Access.RO_User, 1],
    [Access.RW_User, 2]
]);

interface Props {
    onChange: (access: Access) => void;
    accessTypes: Access[];
    access?: Access;
    className?: string;
    maxAccess?: Access;
    mark?: Access | Access[] | Set<Access>;
}

const buttonColorClasses = (level: Access, access: Access, maxAccess?: Access) => {
    const res = access === level ? ['button--primary'] : ['button--secondary'];
    if (!maxAccess) {
        return res;
    }
    const maxAccessLevel = maxAccess ? AccessLevels.get(maxAccess)! : 3;
    const disabled = maxAccessLevel < AccessLevels.get(level)!;
    if (disabled) {
        res.push(styles.unaffected);
    }
    return res;
};

const AccessSelector = observer((props: Props) => {
    const marked = React.useMemo(() => {
        if (Array.isArray(props.mark)) {
            return new Set(props.mark);
        }
        if (props.mark instanceof Set) {
            return props.mark;
        }
        return new Set([props.mark]);
    }, [props.mark]);

    return (
        <div className={clsx(styles.selector, props.className, 'button-group')}>
            {props.accessTypes.map((acc) => {
                return (
                    <button
                        key={acc}
                        className={clsx(
                            'button',
                            buttonColorClasses(acc, props.access!, props.maxAccess),
                            'button--sm',
                            styles.button
                        )}
                        onClick={() => props.onChange(acc)}
                    >
                        {marked.has(acc) ? (
                            <Icon
                                path={mdiCircleSmall}
                                className={clsx(styles.mark)}
                                color="var(--ifm-color-warning)"
                                size={1}
                            />
                        ) : null}
                        {AccessNames[acc]}
                    </button>
                );
            })}
        </div>
    );
});

export default AccessSelector;
