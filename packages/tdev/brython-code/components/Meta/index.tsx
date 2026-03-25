import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { DOM_ELEMENT_IDS } from '../../index';
import Turtle from './Graphics/Turtle';
import Canvas from './Graphics/Canvas';
import Graphics from './Graphics';
import BrythonCommunicator from './BrythonCommunicator';
import Script from '@tdev/brython-code/models/Script';
import { useFullscreenTargetId } from '@tdev-hooks/useFullscreenTargetId';

interface Props {
    code: Script;
}

const getNearestScrollParent = (el: HTMLElement | null): HTMLElement | null => {
    let parent = el?.parentElement;
    while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        if (/(auto|scroll|overlay)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
};

const Meta = observer((props: Props) => {
    const { code } = props;
    const pageStore = useStore('pageStore');
    const viewStore = useStore('viewStore');

    const fullscreenTargetId = useFullscreenTargetId();
    const isFullscreen = viewStore.isFullscreenTarget(fullscreenTargetId);
    const ref = React.useRef<HTMLDivElement>(null);
    const parentRef = React.useMemo(() => {
        if (ref.current && pageStore.runningTurtleScriptId === code.id) {
            return getNearestScrollParent(ref.current);
        }
        return null;
    }, [ref, code.graphicsModalExecutionNr, code, pageStore]);
    if (code.lang !== 'python') {
        return null;
    }
    const scrollOffsetY = isFullscreen ? undefined : parentRef?.scrollTop;
    return (
        <>
            <div id={DOM_ELEMENT_IDS.outputDiv(code.codeId)} ref={ref}></div>
            {code.graphicsModalExecutionNr > 0 && (
                <>
                    {code.hasTurtleOutput && pageStore.runningTurtleScriptId === code.id && (
                        <Turtle code={code} scrollOffsetY={scrollOffsetY} />
                    )}
                    {code.hasCanvasOutput && <Canvas code={code} scrollOffsetY={scrollOffsetY} />}
                    {!code.hasCanvasOutput && !code.hasTurtleOutput && (
                        <Graphics code={code} scrollOffsetY={scrollOffsetY} />
                    )}
                </>
            )}
            {code.lang === 'python' && <BrythonCommunicator code={code} />}
        </>
    );
});

export default Meta;
