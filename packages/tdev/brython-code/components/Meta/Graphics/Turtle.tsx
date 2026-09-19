import { mdiAnimationPlay, mdiDownload } from '@mdi/js';
import Button from '@tdev-components/documents/CodeEditor/Button';
import { DOM_ELEMENT_IDS } from '@tdev/brython-code';
import { saveSvg } from '@tdev/brython-code/components/utils/saveSvg';
import Script from '@tdev/brython-code/models/Script';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import Graphics from '.';
import styles from './styles.module.scss';

interface Props {
    code: Script;
    scrollOffsetY?: number;
}

const Turtle = observer((props: Props) => {
    const { code, scrollOffsetY } = props;
    return (
        <Graphics
            code={code}
            scrollOffsetY={scrollOffsetY}
            controls={
                <React.Fragment>
                    <Button
                        icon={mdiAnimationPlay}
                        onClick={() => {
                            const turtleResult = document.getElementById(
                                DOM_ELEMENT_IDS.turtleSvgContainer(code.codeId)
                            ) as any as SVGSVGElement;
                            if (turtleResult) {
                                saveSvg(turtleResult, `${code.codeId}`, code.code, true);
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
                                DOM_ELEMENT_IDS.turtleSvgContainer(code.codeId)
                            ) as any as SVGSVGElement;
                            if (turtleResult) {
                                saveSvg(turtleResult, `${code.codeId}`, code.code);
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
