import * as React from 'react';
import styles from './styles.module.scss';
import { DOM_ELEMENT_IDS } from '@tdev/script/components/CodeEditor/constants';
import Draggable from 'react-draggable';
import { checkForButtonClick } from '@tdev/script/components/Editor/utils/checkForButtonClick';
import Button from '@tdev/script/components/Button';
import clsx from 'clsx';
import { DocumentType } from '@tdev-api/document';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { observer } from 'mobx-react-lite';
import { mdiClose } from '@mdi/js';
export interface Props {
    controls?: React.ReactNode;
    main?: React.ReactNode;
}
const Graphics = observer((props: Props) => {
    const script = useDocument<'script'>();
    const nodeRef = React.useRef<HTMLDivElement>(null);
    return (
        <Draggable
            onStop={checkForButtonClick}
            positionOffset={{ x: '15%', y: '25%' }}
            nodeRef={nodeRef as React.RefObject<HTMLDivElement>}
        >
            <div className={styles.brythonGraphicsResult} ref={nodeRef}>
                <div className={styles.brythonGraphicsResultHead}>
                    <span>Output</span>
                    <span className={styles.spacer}></span>
                    {props.controls}
                    <Button
                        icon={mdiClose}
                        className={clsx(styles.closeButton)}
                        onClick={() => {
                            script.stopScript();
                            script.closeGraphicsModal();
                        }}
                        iconSize="12px"
                    />
                </div>
                <div
                    id={DOM_ELEMENT_IDS.graphicsResult(script.codeId)}
                    className={clsx('brython-graphics-result', styles.brythonGraphicsResultMain)}
                    key={`exec-${script.graphicsModalExecutionNr}`}
                >
                    {props.main}
                </div>
            </div>
        </Draggable>
    );
});

export default Graphics;
