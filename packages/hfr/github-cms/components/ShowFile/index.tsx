import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import FileStub from '../../models/FileStub';
import Dir from '../../models/Dir';
import File from '../../models/File';
import BinFile from '../../models/BinFile';
import { useLoadedFile } from '../MdxEditor/hooks/useLoadedFile';
import Loader from '@tdev-components/Loader';
import Directory from '../MdxEditor/Directory';
import ImagePreview from '../Github/iFile/File/FilePreview/ImagePreview';
import VideoPreview from '../Github/iFile/File/FilePreview/VideoPreview';
import MdxEditor from '../MdxEditor';
import DefaultEditor from '../Github/DefaultEditor';
import Card from '@tdev-components/shared/Card';
import AudioPreview from '../Github/iFile/File/FilePreview/AudioPreview';

interface Props {
    file: FileStub | Dir | File | BinFile;
}

const Centered = observer(({ children }: { children: React.ReactNode }) => {
    return <div className={clsx(styles.centered)}>{children}</div>;
});

const ShowFile = observer((props: Props) => {
    const { file } = props;
    const loadedFile = useLoadedFile(file);
    if (!loadedFile) {
        return <Loader label={`Lade ${file.name}`} />;
    }
    switch (loadedFile.type) {
        case 'dir':
            return <Directory dir={loadedFile} />;
        case 'file':
            if (loadedFile.isMarkdown && !loadedFile.preventMdxEditor) {
                return <MdxEditor file={loadedFile} key={loadedFile.componentKey} />;
            }
            return <DefaultEditor file={loadedFile} key={loadedFile.componentKey} />;
        case 'bin_file':
            if (loadedFile.isImage) {
                return (
                    <Centered>
                        <ImagePreview src={loadedFile.src} fileName={loadedFile.name} />
                    </Centered>
                );
            }
            if (loadedFile.isVideo) {
                return (
                    <Centered>
                        <VideoPreview src={loadedFile.src} fileName={loadedFile.name} controls />
                    </Centered>
                );
            }
            if (loadedFile.isAudio) {
                return (
                    <Centered>
                        <AudioPreview src={loadedFile.src} fileName={loadedFile.name} controls />
                    </Centered>
                );
            }
    }
    return (
        <Centered>
            <Card header={<h4>{loadedFile.path}</h4>}>Keine Vorschau verfügbar</Card>
        </Centered>
    );
});

export default ShowFile;
