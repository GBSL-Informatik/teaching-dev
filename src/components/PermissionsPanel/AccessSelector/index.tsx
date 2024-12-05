import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { Access } from '@tdev-api/document';
import Icon from '@mdi/react';
import { mdiCircleSmall } from '@mdi/js';

const AccessNames: { [key in Access]: string } = {
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

interface Props {
    onChange: (access: Access) => void;
    accessTypes: Access[];
    access?: Access;
    className?: string;
    mark?: Set<Access>;
}

const AccessSelector = observer((props: Props) => {
    return (
        <div className={clsx(styles.selector, props.className, 'button-group')}>
            {props.accessTypes.map((acc) => (
                <button
                    key={acc}
                    className={clsx(
                        'button',
                        props.access === acc ? 'button--primary' : 'button--secondary',
                        'button--sm',
                        styles.button
                    )}
                    onClick={() => props.onChange(acc)}
                >
                    {props.mark?.has(acc) ? (
                        <Icon
                            path={mdiCircleSmall}
                            className={clsx(styles.mark)}
                            color="var(--ifm-color-warning)"
                            size={1}
                        />
                    ) : null}
                    {AccessNames[acc]}
                </button>
            ))}
        </div>
    );
});

export default AccessSelector;
