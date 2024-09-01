import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Script from '@site/src/models/documents/Script';
import Header from './Header';
import HiddenCode from './HiddenCode';
import EditorAce from './EditorAce';
import Result from './Result';
import { DOM_ELEMENT_IDS } from '../constants';
import { useDocument } from '../../useContextDocument';
import { DocumentType } from '@site/src/api/document';
import Graphics from './Result/Graphics';
import Canvas from './Result/Graphics/Canvas';
import Turtle from './Result/Graphics/Turtle';
import { observer } from 'mobx-react-lite';

const Editor = observer(() => {
    const script = useDocument<DocumentType.Script>();
    return (
        <React.Fragment>
            <Header />
            <div className={clsx(styles.editorContainer)}>
                <HiddenCode type="pre" />
                <EditorAce />
                <HiddenCode type="post" />
            </div>
            {script.lang === 'python' && (
                <>
                    <Result />
                    <div id={DOM_ELEMENT_IDS.outputDiv(script.codeId)}></div>
                    {script.graphicsModalExecutionNr > 0 && (
                        <>
                            {script.hasTurtleOutput && <Turtle />}
                            {script.hasCanvasOutput && <Canvas />}
                            {!script.hasCanvasOutput && !script.hasTurtleOutput && <Graphics />}
                        </>
                    )}
                </>
            )}
        </React.Fragment>
    );
});

export default Editor;
