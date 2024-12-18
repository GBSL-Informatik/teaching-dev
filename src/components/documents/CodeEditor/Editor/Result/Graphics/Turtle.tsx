import * as React from 'react';
import styles from './styles.module.scss';
import { DOM_ELEMENT_IDS } from '@tdev-components/documents/CodeEditor/constants';
import Graphics from '@tdev-components/documents/CodeEditor/Editor/Result/Graphics';
import { saveSvg } from '@tdev-components/documents/CodeEditor/Editor/utils/saveSvg';
import Button from '@tdev-components/documents/CodeEditor/Button';
import clsx from 'clsx';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { DocumentType } from '@tdev-api/document';
import { observer } from 'mobx-react-lite';
import { mdiAnimationPlay, mdiDownload } from '@mdi/js';

const Turtle = observer(() => {
    const script = useDocument<DocumentType.Script>();
    return (
        <Graphics
            controls={
                <React.Fragment>
                    <Button
                        icon={mdiAnimationPlay}
                        onClick={() => {
                            const turtleResult = document.getElementById(
                                DOM_ELEMENT_IDS.turtleSvgContainer(script.codeId)
                            ) as any as SVGSVGElement;
                            if (turtleResult) {
                                saveSvg(turtleResult, `${script.codeId}`, script.code, true);
                            }
                        }}
                        className={clsx(styles.slimStrippedButton)}
                        iconSize="12px"
                        title="Download Animated SVG"
                    />
                    <Button
                        icon={mdiDownload}
                        iconSize="12px"
                        onClick={() => {
                            const turtleResult = document.getElementById(
                                DOM_ELEMENT_IDS.turtleSvgContainer(script.codeId)
                            ) as any as SVGSVGElement;
                            if (turtleResult) {
                                saveSvg(turtleResult, `${script.codeId}`, script.code);
                            }
                        }}
                        title="Download SVG"
                        className={styles.slimStrippedButton}
                    />
                </React.Fragment>
            }
        />
    );
});

export default Turtle;
