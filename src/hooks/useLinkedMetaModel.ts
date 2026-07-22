import React from 'react';
import { AssessableTypeModelMapping } from '@tdev-api/document';
import { AssessableType } from '@tdev-api/document';
import { AssessableMeta } from '@tdev-models/documents/Assessable/AssessableMeta';
import iAssessable from '@tdev-models/documents/Assessable/iAssessable';

const useLinkedMetaModel = <Type extends AssessableType>(
    doc: AssessableTypeModelMapping[Type] | undefined | null,
    meta: AssessableMeta<Type>
) => {
    React.useEffect(() => {
        (doc as iAssessable<Type> | undefined)?.setLinkedMeta(meta);
    }, [doc, meta]);
};

export default useLinkedMetaModel;
