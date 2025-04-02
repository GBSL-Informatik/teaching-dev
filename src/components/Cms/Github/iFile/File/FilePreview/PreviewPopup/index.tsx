import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import type { FileType } from '@tdev-models/cms/FileStub';
import Popup from 'reactjs-popup';
import FilePreview from '..';

interface Props {
    file: FileType;
    children: React.ReactNode;
    inlineTrigger?: boolean;
}

const PreviewPopup = observer((props: Props) => {
    return (
        <Popup
            trigger={props.inlineTrigger ? <span>{props.children}</span> : <div>{props.children}</div>}
            on="hover"
            keepTooltipInside="#__docusaurus"
            position={['top left', 'left center']}
            mouseEnterDelay={200}
            offsetX={150 / 2}
            repositionOnResize
        >
            <FilePreview file={props.file} />
        </Popup>
    );
});

export default PreviewPopup;
