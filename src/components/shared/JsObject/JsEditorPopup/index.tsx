import React from 'react';
import _ from 'es-toolkit/compat';
import Popup from 'reactjs-popup';
import { mdiCog } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import type { PopupActions } from 'reactjs-popup/dist/types';
import type { Props as EditorProps } from '../Editor';
import Card from '@tdev-components/shared/Card';
import JsObjectEditor from '../Editor';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

interface Props extends EditorProps {
    title?: string;
}

const JsEditorPopup = (props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiCog} size={SIZE_S} title={props.title} />
                </span>
            }
            keepTooltipInside="#__docusaurus"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)', maxWidth: '100vw' }}
            ref={ref}
            modal
            on="click"
            repositionOnResize
            nested
        >
            <Card>
                <JsObjectEditor
                    {...props}
                    onSave={(js) => {
                        props.onSave?.(js);
                        ref.current?.close();
                    }}
                />
            </Card>
        </Popup>
    );
};
export default JsEditorPopup;
