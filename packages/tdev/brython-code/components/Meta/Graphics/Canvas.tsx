import * as React from 'react';
import styles from './styles.module.scss';
import Button from '@tdev-components/documents/CodeEditor/Button';
import { observer } from 'mobx-react-lite';
import { mdiDownload } from '@mdi/js';
import Script from '@tdev/brython-code/models/Script';
import Graphics from '.';
import { DOM_ELEMENT_IDS } from '@tdev/brython-code';

const downloadCanvas = (canvasId: string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
        return;
    }
    var dt = canvas.toDataURL('image/png');
    /* Change MIME type to trick the browser to downlaod the file instead of displaying it */
    dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');

    /* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
    dt = dt.replace(
        /^data:application\/octet-stream/,
        'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png'
    );

    var downloadLink = document.createElement('a');
    downloadLink.href = dt;
    downloadLink.download = `${canvasId}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};

interface Props {
    code: Script;
    scrollOffsetY?: number;
}

const Canvas = observer((props: Props) => {
    const { code } = props;

    return (
        <Graphics
            code={code}
            scrollOffsetY={props.scrollOffsetY}
            controls={
                <Button
                    icon={mdiDownload}
                    iconSize="12px"
                    onClick={() => {
                        downloadCanvas(DOM_ELEMENT_IDS.canvasContainer(code.codeId));
                    }}
                    title="Download SVG"
                    className={styles.slimStrippedButton}
                />
            }
            main={
                <canvas
                    id={DOM_ELEMENT_IDS.canvasContainer(code.codeId)}
                    width="500"
                    height="500"
                    style={{
                        display: 'block',
                        width: '500px',
                        height: '500px'
                    }}
                ></canvas>
            }
        />
    );
});

export default Canvas;
