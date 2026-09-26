import { Access, DocumentType } from '@tdev-api/document';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { observer } from 'mobx-react-lite';
import AccessSelector from '.';

interface Props {
    documentRoot: DocumentRoot<DocumentType>;
    maxAccess?: Access;
    className?: string;
    mark?: Access | Access[] | Set<Access>;
}

const SharedAccessSelector = observer((props: Props) => {
    const { documentRoot } = props;

    return (
        <AccessSelector
            accessTypes={[Access.None_DocumentRoot, Access.RO_DocumentRoot, Access.RW_DocumentRoot]}
            access={documentRoot.sharedAccess}
            onChange={(access) => {
                documentRoot.setSharedAccess(access);
            }}
            maxAccess={props.maxAccess}
            mark={props.mark}
        />
    );
});

export default SharedAccessSelector;
