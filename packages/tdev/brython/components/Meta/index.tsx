import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import type Script from '@tdev-models/documents/Script';
import { DOM_ELEMENT_IDS } from '../../index';
import Turtle from './Graphics/Turtle';
import Canvas from './Graphics/Canvas';
import Graphics from './Graphics';
import BrythonCommunicator from './BrythonCommunicator';

interface Props {
    script: Script;
}

const Meta = observer((props: Props) => {
    const { script } = props;
    const pageStore = useStore('pageStore');
    if (script.lang !== 'python') {
        return null;
    }
    return (
        <>
            <div id={DOM_ELEMENT_IDS.outputDiv(script.codeId)}>
                {script.versionsLoaded ? 'Ja' : 'Nein'} - {script.id}
            </div>
            {script.graphicsModalExecutionNr > 0 && (
                <>
                    {script.hasTurtleOutput && pageStore.runningTurtleScriptId === script.id && (
                        <Turtle script={script} />
                    )}
                    {script.hasCanvasOutput && <Canvas script={script} />}
                    {!script.hasCanvasOutput && !script.hasTurtleOutput && <Graphics script={script} />}
                </>
            )}
            {script.lang === 'python' && <BrythonCommunicator script={script} />}
        </>
    );
});

export default Meta;
