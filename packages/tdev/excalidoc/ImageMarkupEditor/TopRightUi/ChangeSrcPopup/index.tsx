import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { mdiFileReplace } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import clsx from 'clsx';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import ChangeSrc from './ChangeSrc';

interface Props {
    api: ExcalidrawImperativeAPI;
    updateScene: (appState: ExcalidrawInitialDataState) => void;
    className?: string;
}

const ChangeSrcPopup = (props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Popup
            trigger={
                <div className={clsx(props.className)}>
                    <Button
                        icon={mdiFileReplace}
                        active={isOpen}
                        title="Hintergrundbild ändern"
                        color="primary"
                    />
                </div>
            }
            ref={ref}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            closeOnDocumentClick={false}
            modal
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            nested
        >
            <ChangeSrc api={props.api} onClose={() => ref.current?.close()} updateScene={props.updateScene} />
        </Popup>
    );
};

export default ChangeSrcPopup;
