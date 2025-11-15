import styles from './styles.module.scss';
import { mdiAccountMultiple, mdiAccountPlus } from '@mdi/js';
import Icon from '@mdi/react';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import Button from '../../shared/Button';
import AddUser from './AddUser';
import ImportFromList from './ImportFromList';
import ImportGroup from './ImportGroup';
import { AddMembersPopupProps } from './types';

const AddUserPopup = observer((props: AddMembersPopupProps) => {
    const popupRef = React.useRef<PopupActions>(null);

    return (
        <Popup
            trigger={
                <div>
                    <Button
                        className={clsx('button--block')}
                        onClick={(e) => {
                            e.preventDefault();
                        }}
                        icon={mdiAccountPlus}
                        color="green"
                        text="Hinzufügen"
                        iconSide="left"
                    />
                </div>
            }
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)', maxWidth: '100vw' }}
            closeOnDocumentClick
            closeOnEscape
            modal
            ref={popupRef}
        >
            <div className={clsx(styles.wrapper, 'card')}>
                <div className={clsx(styles.addMembersPopupTitle)}>
                    <Icon path={mdiAccountMultiple} size="1.4em" />
                    <h2>{props.studentGroup.name}</h2>
                </div>
                <Tabs className={clsx(styles.tabs)}>
                    <TabItem value="add" label="Individuell">
                        <AddUser {...props} popupRef={popupRef} />
                    </TabItem>
                    <TabItem value="fromGroup" label="Aus Gruppe">
                        <ImportGroup {...props} popupRef={popupRef} />
                    </TabItem>
                    <TabItem value="fromList" label="Aus Liste">
                        <ImportFromList {...props} popupRef={popupRef} />
                    </TabItem>
                </Tabs>
            </div>
        </Popup>
    );
});

export default AddUserPopup;
