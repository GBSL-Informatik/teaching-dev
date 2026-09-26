import { mdiAccountReactivateOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import clsx from 'clsx';
import styles from './styles.module.scss';

interface Props {
    message: string | React.ReactElement;
    onUndo: () => void;
    onClose: () => void;
}

const Undo = ({ message, onUndo, onClose }: Props) => {
    return (
        <div className={clsx('alert alert--warning', styles.removeAlert)} role="alert" key={'imported'}>
            <button
                aria-label="Close"
                className={clsx('clean-btn close')}
                type="button"
                onClick={() => onClose()}
            >
                <span aria-hidden="true">&times;</span>
            </button>
            {message}
            <Button
                onClick={() => onUndo()}
                icon={mdiAccountReactivateOutline}
                text="Rückgängig"
                className={clsx('button--block')}
                iconSide="left"
                color="primary"
            />
        </div>
    );
};

export default Undo;
