import { mdiFolderOpenOutline, mdiFolderPlus, mdiPlusCircleOutline } from '@mdi/js';
import Icon from '@mdi/react';
import Alert from '@tdev-components/shared/Alert';
import Button from '@tdev-components/shared/Button';
import TextInput from '@tdev-components/shared/TextInput';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { CreatableFileType } from '@tdev-stores/DocumentStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import styles from './styles.module.scss';

interface Props {
    directory: Directory;
}

const withExtension = (name: string, extension: string) => {
    if (name.toLowerCase().endsWith(extension.toLowerCase())) {
        return name;
    }
    return `${name}${extension}`;
};

const NewItem = observer((props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const documentStore = useStore('documentStore');
    const { directory } = props;
    if (!directory.root) {
        return null;
    }

    const handleCreated = () => {
        setError(null);
        ref.current?.close();
    };
    const handleError = (error: unknown) => {
        setError(error instanceof Error ? error.message : 'Die Datei konnte nicht erstellt werden.');
    };
    const handleCreateFile = ({ type, config }: CreatableFileType) => {
        const fileName = withExtension(name || config.name || type, config.extension);
        directory.createFile(type, fileName).then(handleCreated).catch(handleError);
    };
    const handleCreateDir = () => {
        directory.createDir(name).then(handleCreated).catch(handleError);
    };

    return (
        <Popup
            trigger={
                <span>
                    <Button text="Neu" icon={mdiPlusCircleOutline} color="primary" size={0.8} />
                </span>
            }
            modal
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            ref={ref}
        >
            <div className={clsx('card', styles.card)}>
                <div className={clsx('card__header', styles.header)}>
                    <h4 className={clsx(styles.h4)}>
                        <Icon path={mdiFolderOpenOutline} size={1} /> {directory.name}
                    </h4>
                </div>
                <div className={clsx('card__body', styles.body)}>
                    <TextInput onChange={setName} placeholder="Name" />
                    {documentStore.creatableFileTypes.map((fileType) => (
                        <Button
                            key={`${fileType.type}${fileType.config.extension}`}
                            text={fileType.config.name || fileType.config.extension || fileType.type}
                            title={fileType.config.description}
                            color={fileType.config.iconColor}
                            size={0.8}
                            icon={fileType.config.icon}
                            iconSide="left"
                            onClick={() => handleCreateFile(fileType)}
                        />
                    ))}
                    <Button
                        text="Neuer Ordner"
                        color="black"
                        size={0.8}
                        icon={mdiFolderPlus}
                        iconSide="left"
                        onClick={handleCreateDir}
                    />
                    {error && <Alert type="danger">{error}</Alert>}
                </div>
            </div>
        </Popup>
    );
});

export default NewItem;
