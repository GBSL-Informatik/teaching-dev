import { observer } from 'mobx-react-lite';
import { ExcalidocComponent } from '.';
import Excalidoc from '../model';

interface Props {
    document: Excalidoc;
}

const DocumentView = observer((props: Props) => {
    const { document } = props;
    return <ExcalidocComponent doc={document} height="80vh" allowImageInsertion />;
});

export default DocumentView;
