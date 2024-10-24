import { observer } from 'mobx-react-lite';
import { JSX } from 'react';
import { CmsTextMeta } from '@tdev-models/documents/CmsText';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';

interface Props {
    id: string;
    dt: string | JSX.Element;
}

const CmsDeflistEntry = observer((props: Props) => {
    // Not using useFirstMainDocument() here because that would always supply a (dummy) document.
    const docRoot = useDocumentRoot(props.id, new CmsTextMeta({}), false);
    const doc = docRoot?.firstMainDocument;

    return doc ? (
        <>
            <dt>{props.dt}</dt>
            <dd>{doc.text}</dd>
        </>
    ) : (
        <></>
    );
});

export default CmsDeflistEntry;
