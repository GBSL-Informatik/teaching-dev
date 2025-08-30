import React from 'react';
import { observer } from 'mobx-react-lite';
import _ from 'es-toolkit/compat';
import File from '@tdev-models/cms/File';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Loader from '@tdev-components/Loader';

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
