import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import FileStub from '@tdev-models/cms/FileStub';
import Dir from '@tdev-models/cms/Dir';
import File from '@tdev-models/cms/File';
import BinFile from '@tdev-models/cms/BinFile';
import { useLoadedFile } from '@tdev-components/Cms/MdxEditor/hooks/useLoadedFile';
import Loader from '@tdev-components/Loader';
import Directory from '@tdev-components/Cms/MdxEditor/Directory';
import ImagePreview from '@tdev-components/Cms/Github/iFile/File/FilePreview/ImagePreview';
import VideoPreview from '@tdev-components/Cms/Github/iFile/File/FilePreview/VideoPreview';
import MdxEditor from '@tdev-components/Cms/MdxEditor';
import DefaultEditor from '@tdev-components/Cms/Github/DefaultEditor';
import Card from '@tdev-components/shared/Card';
import AudioPreview from '@tdev-components/Cms/Github/iFile/File/FilePreview/AudioPreview';

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
