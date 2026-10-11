import { AssessableType, AssessableTypeModelMapping } from '@tdev-api/document';
import { AssessableMeta } from '@tdev-models/documents/Assessable/AssessableMeta';
import type iAssessable from '@tdev-models/documents/Assessable/iAssessable';
import React from 'react';

const useLinkedMetaModel = <Type extends AssessableType>(
    doc: AssessableTypeModelMapping[Type] | undefined | null,
    meta: AssessableMeta<Type>
) => {
    React.useEffect(() => {
        if (!doc) {
            return;
        }
        if (doc.type === meta.type) {
            // The mapped model union loses its correlation with Type; the guard verifies it at runtime.
            (doc as unknown as iAssessable<Type>).setLinkedMeta(meta);
        }
    }, [doc, meta]);
};

export default useLinkedMetaModel;
