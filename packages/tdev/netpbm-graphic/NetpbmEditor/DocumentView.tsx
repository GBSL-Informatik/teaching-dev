import { observer } from 'mobx-react-lite';
import NetpbmGraphic from '../model';
import NetpbmComponent from './NetpbmComponent';

interface Props {
    document: NetpbmGraphic;
}

const DocumentView = observer((props: Props) => {
    return <NetpbmComponent doc={props.document} />;
});

export default DocumentView;
