import { useDocument } from '@tdev-hooks/useDocument';
import { observer } from 'mobx-react-lite';
import Image from './Image';

export interface Props {
    documentId: string;
}

const Preview = observer((props: Props) => {
    const excalidoc = useDocument<'excalidoc'>(props.documentId);
    if (!excalidoc) {
        return null;
    }
    return <Image image={excalidoc.data.image} />;
});

export default Preview;
