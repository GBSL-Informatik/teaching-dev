import React from 'react';
import clsx from 'clsx';
import { PopupActions } from 'reactjs-popup/dist/types';
import Popup from 'reactjs-popup';
import { mdiCog, mdiFileReplace } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import JsObjectEditor from '@tdev-components/shared/JsObject/Editor';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { getMetaElementFromScene } from '../../helpers/getElementsFromScene';
import { getCustomProps, CustomProps, updateCustomProps } from '../../helpers/customProps';
import { JsTypes } from '@tdev-components/shared/JsObject/toJsSchema';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props {
    api: ExcalidrawImperativeAPI;
    onSave: () => void;
    className?: string;
}

const UpdateCustomProps = (props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [tdevProps, setTdevProps] = React.useState(getCustomProps());

    return (
        <Popup
            trigger={
                <div className={clsx(props.className)}>
                    <Button icon={mdiCog} active={isOpen} title="Hintergrundbild ändern" color="primary" />
                </div>
            }
            ref={ref}
            onOpen={() => {
                const meta = getMetaElementFromScene(props.api.getSceneElementsIncludingDeleted());
                const tdevProps = getCustomProps(meta);
                setTdevProps(tdevProps);
                setIsOpen(true);
            }}
            onClose={() => setIsOpen(false)}
            modal
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            nested
        >
            <Card>
                {isOpen && (
                    <JsObjectEditor
                        js={tdevProps as unknown as Record<string, JsTypes>}
                        hideAddValue={true}
                        editorConfig={{
                            numberStep: 1
                        }}
                        onSave={(js) => {
                            updateCustomProps(props.api, js as unknown as CustomProps);
                            ref.current?.close();
                            props.onSave();
                        }}
                    />
                )}
            </Card>
        </Popup>
    );
};

export default UpdateCustomProps;
