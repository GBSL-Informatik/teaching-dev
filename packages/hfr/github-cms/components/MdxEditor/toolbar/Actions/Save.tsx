import { mdiCircle, mdiContentSave } from '@mdi/js';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import { Color } from '@tdev-components/shared/Colors';
import { apiButtonColor, apiIcon } from '@tdev-components/utils/apiStateIcon';
import { ApiState } from '@tdev-stores/iStore';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../../hooks/useCmsStore';
import File from '../../../../models/File';

export interface Props {
    file: File;
    showIcon?: boolean;
    apiState?: ApiState;
    color?: Color | string;
    className?: string;
}

const Save = observer((props: Props) => {
    const { file } = props;
    const cmsStore = useCmsStore();
    return (
        <Button
            icon={
                props.showIcon || props.apiState === ApiState.SYNCING
                    ? apiIcon(mdiContentSave, props.apiState)
                    : undefined
            }
            iconSide="left"
            onClick={() => {
                file.save();
            }}
            text="Speichern"
            disabled={!file.isDirty || file.isOnMainBranch || !cmsStore.github?.canWrite}
            color={apiButtonColor(props.color ?? 'green', props.apiState)}
            spin={props.apiState === ApiState.SYNCING}
            className={props.className}
            floatingIcon={
                file.isDirty &&
                file.isOnMainBranch && <Icon path={mdiCircle} size={0.3} color="var(--ifm-color-success)" />
            }
        />
    );
});

export default Save;
