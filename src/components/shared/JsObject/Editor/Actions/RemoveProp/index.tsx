import { mdiCloseCircleOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type iJs from '../../models/iJs';
import styles from './styles.module.scss';

interface Props {
    js: iJs;
}

const RemoveProp = observer((props: Props) => {
    const { js } = props;
    if (js.isParent) {
    }
    return (
        <div className={clsx(styles.changeType)}>
            {js.isParent ? (
                <Confirm
                    size={SIZE_XS}
                    icon={mdiCloseCircleOutline}
                    color="red"
                    onConfirm={() => {
                        js.remove();
                    }}
                />
            ) : (
                <Button
                    size={SIZE_XS}
                    icon={mdiCloseCircleOutline}
                    color="red"
                    onClick={() => {
                        js.remove();
                    }}
                />
            )}
        </div>
    );
});

export default RemoveProp;
