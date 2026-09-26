import Icon from '@mdi/react';
import { useStore } from '@tdev-hooks/useStore';
import type { iTaskableDocument } from '@tdev-models/iTaskableDocument';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

interface Props {
    editingStatus: iTaskableDocument[];
}

const EditingStateList = observer((props: Props) => {
    const { editingStatus } = props;
    const userStore = useStore('userStore');
    return (
        <>
            {editingStatus.map((es, idx) => {
                const { path, color, title } = es.editingIconState;
                return (
                    <span
                        className={styles.taskState}
                        key={idx}
                        title={title}
                        onClick={() => {
                            es.setScrollTo(true);
                            if (userStore.viewedUserId !== es.authorId) {
                                userStore.switchUser(es.authorId);
                            }
                        }}
                    >
                        <Icon path={path} color={color} size={0.8} />
                    </span>
                );
            })}
        </>
    );
});

export default EditingStateList;
