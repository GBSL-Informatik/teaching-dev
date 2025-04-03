import React from 'react';
import { observer } from 'mobx-react-lite';
import _ from 'lodash';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Loader from '@tdev-components/Loader';


const NodeMap = observer((props) => {
    return (
        <BrowserOnly
            fallback={
                <div>
                    <Loader label="Load NodeMap" />
                </div>
            }
        >
            {() => {
                const LibComponent = require('./NodeMap').default;
                return <LibComponent {...props} />;
            }}
        </BrowserOnly>
    );
});

export default NodeMap;
