import * as React from 'react';
import styles from './styles.module.scss';
import Draggable from 'react-draggable';
import { checkForButtonClick } from '../../utils/checkForButtonClick';
import Button from '@tdev-components/documents/CodeEditor/Button';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { mdiClose } from '@mdi/js';
import type Script from '@tdev/brython-code/models/Script';
import { DOM_ELEMENT_IDS } from '../../..';

export interface Props {
    code: Script;
    controls?: React.ReactNode;
    main?: React.ReactNode;
    scrollOffsetY?: number;
}
const Graphics = observer((props: Props) => {
    const { code } = props;
    const nodeRef = React.useRef<HTMLDivElement>(null);
    return (
        <Draggable
            onStop={checkForButtonClick}
            positionOffset={{ x: '15%', y: '25%' }}
            nodeRef={nodeRef as React.RefObject<HTMLDivElement>}
            defaultPosition={{ y: -1 * (props.scrollOffsetY ?? 0), x: 0 }}
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
                            code.stopScript();
                            code.closeGraphicsModal();
                        }}
                        iconSize="12px"
                    />
                </div>
                <div
                    id={DOM_ELEMENT_IDS.graphicsResult(code.codeId)}
                    className={clsx('brython-graphics-result', styles.brythonGraphicsResultMain)}
                    key={`exec-${code.graphicsModalExecutionNr}`}
                >
                    {props.main}
                </div>
            </div>
        </Draggable>
    );
});

export default Graphics;
