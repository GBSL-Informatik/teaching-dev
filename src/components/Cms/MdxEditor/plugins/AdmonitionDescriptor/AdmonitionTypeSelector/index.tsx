import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import _ from 'lodash';

interface Props {
    currentName: string;
    onChange: (name: string) => void;
}

const AdmonitionTypeSelector = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');

    return (
        <div className={styles.admonitionList}>
            {[...cmsStore.admonitionTypes].map((admoType) => (
                <Button
                    key={admoType}
                    className={clsx(styles.userButton)}
                    iconSide="left"
                    active={props.currentName === admoType}
                    onClick={() => props.onChange(admoType)}
                >
                    {_.capitalize(admoType)}
                </Button>
            ))}
        </div>
    );
});

export default AdmonitionTypeSelector;
