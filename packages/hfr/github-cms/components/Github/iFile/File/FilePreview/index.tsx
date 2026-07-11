import React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import FileStub from '../../../../../models/FileStub';
import BinFile from '../../../../../models/BinFile';
import File from '../../../../../models/File';
import Card from '@tdev-components/shared/Card';
import { useLoadedFile } from '../../../../MdxEditor/hooks/useLoadedFile';
import Loader from '@tdev-components/Loader';
import ImagePreview from './ImagePreview';
import TextPreview from './TextPreview';
import VideoPreview from './VideoPreview';

interface Props {
    file: FileStub | BinFile | File;
}

const FilePreview = observer((props: Props) => {
    const file = useLoadedFile(props.file);
    if (!file) {
        return <Loader label={`Lade ${props.file.name}`} />;
    }
    if (file.type === 'bin_file') {
        if (file.isImage) {
            return <ImagePreview src={file.src} maxWidth={'150px'} maxHeight={'250px'} />;
        }
        if (file.isVideo) {
            return <VideoPreview src={file.src} maxWidth={'150px'} maxHeight={'250px'} playbackRate={3} />;
        }
        return <Card classNames={{ card: styles.card }}>Keine Vorschau verfügbar</Card>;
    }

    return <TextPreview file={file} maxWidth={'250px'} maxHeight={'250px'} />;
});

export default FilePreview;
