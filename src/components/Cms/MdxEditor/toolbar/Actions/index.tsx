import React from 'react';
import { observer } from 'mobx-react-lite';
import _ from 'lodash';
import File from '@tdev-models/cms/File';
import Save from './Save';
import Popup from 'reactjs-popup';
import Button from '@tdev-components/shared/Button';
import {
    mdiChevronDown,
    mdiCloseCircle,
    mdiCloseCircleOutline,
    mdiContentSaveAlert,
    mdiLoading,
    mdiSourceBranchPlus
} from '@mdi/js';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Card from '@tdev-components/shared/Card';
import { PopupActions } from 'reactjs-popup/dist/types';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { useStore } from '@tdev-hooks/useStore';
import { ApiAction, ApiState } from '@tdev-stores/iStore';
import { apiButtonColor, apiIcon } from '@tdev-components/util/apiStateIcon';

export interface Props {
    file: File;
    onNeedsRefresh?: () => void;
}

const Actions = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { github } = cmsStore;
    const { file } = props;
    const ref = React.useRef<PopupActions>(null);
    const [saveState, setSaveState] = React.useState<ApiState>(ApiState.IDLE);
    if (!github) {
        return null;
    }
    return (
        <div className={clsx(styles.actions, 'button-group')}>
            <Save file={file} className={clsx(styles.button)} apiState={saveState} />
            <Popup
                ref={ref}
                trigger={
                    <span>
                        <Button
                            icon={mdiChevronDown}
                            className={clsx(styles.optionsButton, styles.button)}
                            color="black"
                            disabled={!file.isDirty}
                        />
                    </span>
                }
                disabled={!file.isDirty}
                on={'click'}
                keepTooltipInside="#__docusaurus"
                position={['bottom left']}
                arrow={false}
                offsetX={-82}
                offsetY={0}
            >
                <Card classNames={{ card: styles.optionsCard, body: styles.body }}>
                    <ul className={clsx(styles.options)}>
                        <li className={clsx(styles.option)}>
                            <Confirm
                                text="Änderungen verwerfen"
                                onConfirm={() => {
                                    file.reset();
                                    ref.current?.close();
                                    props.onNeedsRefresh?.();
                                }}
                                confirmText="Verwerfen?"
                                confirmIcon={mdiCloseCircle}
                                confirmColor="red"
                                icon={mdiCloseCircleOutline}
                                iconSide="left"
                            />
                        </li>
                        {file.isOnMainBranch && cmsStore.github?.canWrite && (
                            <>
                                <li className={clsx(styles.option)}>
                                    <Button
                                        text="In neuem Branch speichern"
                                        onClick={() => {
                                            const name = github.nextBranchName;
                                            github.saveFileInNewBranchAndCreatePr(file, name).then((res) => {
                                                setSaveState(res ? ApiState.SUCCESS : ApiState.ERROR);
                                            });
                                            setSaveState(ApiState.SYNCING);
                                        }}
                                        spin={saveState === ApiState.SYNCING}
                                        icon={apiIcon(mdiSourceBranchPlus, saveState, true)}
                                        color={apiButtonColor('primary', saveState, true)}
                                        iconSide="left"
                                    />
                                </li>
                                <li className={clsx(styles.option)}>
                                    <Confirm
                                        text={`Speichern`}
                                        onConfirm={() => {
                                            file.save();
                                        }}
                                        icon={apiIcon(mdiContentSaveAlert, saveState, true)}
                                        spin={saveState === ApiState.SYNCING}
                                        confirmColor="orange"
                                        confirmText={`Wirklich im ${file.branch}-Branch speichern?`}
                                        color="green"
                                        iconSide="left"
                                    />
                                </li>
                            </>
                        )}
                    </ul>
                </Card>
            </Popup>
        </div>
    );
});

export default Actions;
