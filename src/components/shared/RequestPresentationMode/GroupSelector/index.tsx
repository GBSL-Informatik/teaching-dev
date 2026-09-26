import { mdiClose } from '@mdi/js';
import { DocumentType } from '@tdev-api/document';
import Button from '@tdev-components/shared/Button';
import StudentGroup from '@tdev-models/StudentGroup';
import iDocument from '@tdev-models/iDocument';
import clsx from 'clsx';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

interface Props {
    group: StudentGroup;
    document: iDocument<DocumentType>;
    color?: string;
    noOutline?: boolean;
}

const GroupSelector = observer((props: Props) => {
    const { group, document } = props;

    return (
        <div className={clsx(styles.activeGroups)} key={group.id}>
            <Button
                noOutline={props.noOutline}
                color={props.color}
                onClick={() => {
                    const root = document.root;
                    if (!root) {
                        return;
                    }
                    group.setCanPresent(true).then(
                        action((updated) => {
                            if (!updated.canPresent) {
                                return;
                            }
                            updated.apiSetPresentedDocumentProps({
                                document: document.props,
                                meta: root.meta,
                                access: root._access,
                                sharedAccess: root._sharedAccess
                            });
                        })
                    );
                }}
                title={
                    group.canPresent
                        ? 'Präsentation starten'
                        : 'Aktuell nicht berechtigt, Präsentationen zu starten - berechtigung wird gesetzt, sobald die Präsentation gestartet wird.'
                }
            >
                {group.name}
            </Button>
            {group.canPresent && (
                <Button
                    icon={mdiClose}
                    onClick={() => {
                        group.setCanPresent(false);
                    }}
                />
            )}
        </div>
    );
});

export default GroupSelector;
