import { mdiClose, mdiCloseBox } from '@mdi/js';
import { useLexicalNodeRemove } from '@mdxeditor/editor';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import clsx from 'clsx';

export interface Props {
    className?: string;
    buttonClassName?: string;
    onRemove?: () => void;
    size?: number;
}

const useRemover = (onRemove?: () => void) => {
    if (onRemove) {
        return onRemove;
    }
    const remover = useLexicalNodeRemove();
    return remover;
};

const RemoveNode = (props: Props) => {
    const remover = useRemover(props.onRemove);
    return (
        <span className={clsx(props.className)}>
            <Confirm
                buttonClassName={clsx(props.buttonClassName)}
                icon={mdiClose}
                confirmIcon={mdiCloseBox}
                text={null}
                confirmText="Entfernen"
                title="Block entfernen"
                color="black"
                size={props.size}
                onConfirm={() => {
                    remover();
                }}
            />
        </span>
    );
};

export default RemoveNode;
