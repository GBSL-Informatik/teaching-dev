import React from 'react';
import { observer } from 'mobx-react-lite';
import type { ContainerType, TypeDataMapping } from '@tdev-api/document';
import { Source } from '@tdev-models/iDocument';
import JsEditorPopup from '@tdev-components/shared/JsObject/JsEditorPopup';
import type { JsTypes } from '@tdev-components/shared/JsObject/toJsSchema';
import iDocumentContainer from '@tdev-models/iDocumentContainer';

interface Props {
    docContainer: iDocumentContainer<any>;
}

const EditDataProps = observer((props: Props) => {
    const { docContainer } = props;
    return (
        <JsEditorPopup
            js={docContainer.data as Record<string, JsTypes>}
            title="Eigenschaften"
            onSave={(js) => {
                docContainer.setData(js as TypeDataMapping[ContainerType], Source.LOCAL, new Date());
            }}
        />
    );
});

export default EditDataProps;
