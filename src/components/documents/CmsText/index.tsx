import { observer } from 'mobx-react-lite';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { CmsTextMeta } from '@tdev-models/documents/CmsText';

interface Props {
    id: string;
}

const CmsText = observer((props: Props) => {
    // Not using useFirstMainDocument() here because that would always supply a (dummy) document.
    // TODO: Factor-out this use case?
    const docRoot = useDocumentRoot(props.id, new CmsTextMeta({}), false);
    const doc = docRoot?.firstMainDocument;

    return doc ? (
        <>
            <span>{doc.text}</span>
        </>
    ) : (
        <></>
    );
});

export default CmsText;
