import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { DOM_ELEMENT_IDS } from '../../index';
import Turtle from './Graphics/Turtle';
import Canvas from './Graphics/Canvas';
import Graphics from './Graphics';
import BrythonCommunicator from './BrythonCommunicator';
import Script from '@tdev/brython-code/models/Script';

interface Props {
    code: Script;
}

const Meta = observer((props: Props) => {
    const { code } = props;
    const pageStore = useStore('pageStore');
    if (code.lang !== 'python') {
        return null;
    }
    return (
        <>
            <div id={DOM_ELEMENT_IDS.outputDiv(code.codeId)}></div>
            {code.graphicsModalExecutionNr > 0 && (
                <>
                    {code.hasTurtleOutput && pageStore.runningTurtleScriptId === code.id && (
                        <Turtle code={code} />
                    )}
                    {code.hasCanvasOutput && <Canvas code={code} />}
                    {!code.hasCanvasOutput && !code.hasTurtleOutput && <Graphics code={code} />}
                </>
            )}
            {code.lang === 'python' && <BrythonCommunicator code={code} />}
        </>
    );
});

export default Meta;
