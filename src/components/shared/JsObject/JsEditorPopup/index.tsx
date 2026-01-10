import React from 'react';
import _ from 'es-toolkit/compat';
import Popup from 'reactjs-popup';
import { mdiCog } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { PopupActions } from 'reactjs-popup/dist/types';
import type { Props as EditorProps } from '../Editor';
import Card from '@tdev-components/shared/Card';
import { useClientLib } from '@tdev-hooks/useClientLib';
import type * as JsObjectEditor from '../Editor';

interface Props extends EditorProps {
    title?: string;
}

const JsEditorPopup = (props: Props) => {
    const Lib = useClientLib<typeof JsObjectEditor>(() => import('../Editor'), '../Editor');
    if (!Lib) {
        return null;
    }
    return <JsPoupup props={props} Lib={Lib} />;
};

const JsPoupup = (jsProps: { props: Props; Lib: typeof JsObjectEditor }) => {
    const ref = React.useRef<PopupActions>(null);
    const { props, Lib } = jsProps;

    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiCog} size={0.8} title={props.title} />
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
                <Lib.default
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
