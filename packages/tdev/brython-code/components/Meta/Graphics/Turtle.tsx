import * as React from 'react';
import styles from './styles.module.scss';
import { saveSvg } from '@tdev/brython-code/components/utils/saveSvg';
import Button from '@tdev-components/documents/CodeEditor/Button';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { mdiAnimationPlay, mdiDownload } from '@mdi/js';
import Script from '@tdev/brython-code/models/Script';
import Graphics from '.';
import { DOM_ELEMENT_IDS } from '@tdev/brython-code';

interface Props {
    script: Script;
}

const Turtle = observer((props: Props) => {
    const { script } = props;
    return (
        <Graphics
            script={script}
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
