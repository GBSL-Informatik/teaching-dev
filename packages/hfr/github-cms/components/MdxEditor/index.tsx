import BrowserOnly from '@docusaurus/BrowserOnly';
import Loader from '@tdev-components/Loader';
import { observer } from 'mobx-react-lite';
import File from '../../models/File';

export interface Props {
    file: File;
}

const MdxEditor = observer((props: Props) => {
    return (
        <BrowserOnly
            fallback={
                <div>
                    <Loader label="Load MdxEditor" />
                </div>
            }
        >
            {() => {
                const LibComponent = require('./CmsMdxEditor').default;
                return <LibComponent {...props} />;
            }}
        </BrowserOnly>
    );
});

export default MdxEditor;
