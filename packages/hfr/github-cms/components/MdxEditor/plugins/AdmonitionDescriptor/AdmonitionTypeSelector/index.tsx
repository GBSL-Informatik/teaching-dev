import Button from '@tdev-components/shared/Button';
import clsx from 'clsx';
import _ from 'es-toolkit/compat';
import { observer } from 'mobx-react-lite';
import { ADMONITION_TYPES } from './admonitionTypes';
import styles from './styles.module.scss';

interface Props {
    currentName: string;
    onChange: (name: string) => void;
}

const AdmonitionTypeSelector = observer((props: Props) => {
    return (
        <div className={styles.admonitionList}>
            {[...ADMONITION_TYPES].map((admoType) => (
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
