import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Branch from '@tdev-models/cms/Branch';
import Card from '@tdev-components/shared/Card';
import Badge from '@tdev-components/shared/Badge';
import Icon from '@mdi/react';
import { mdiClose, mdiFlashTriangle, mdiRecordCircleOutline, mdiSourceBranch } from '@mdi/js';
import TextInput from '@tdev-components/shared/TextInput';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import Button from '@tdev-components/shared/Button';
import PR from '@tdev-models/cms/PR';
import Alert from '@tdev-components/shared/Alert';
import Checkbox from '@tdev-components/shared/Checkbox';
import { withoutPreviewPRName, withPreviewPRName } from '@tdev-models/cms/helpers';

interface Props {
    branch: Branch;
    onDone: (pr?: PR) => void;
    onDiscard: () => void;
}

const NewPR = observer((props: Props) => {
    const { branch } = props;
    const cmsStore = useStore('cmsStore');

    const [title, setTitle] = React.useState(branch.name);
    const [body, setBody] = React.useState(branch.name);
    const [isCreating, setIsCreating] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [createPreview, setCreatePreview] = React.useState(false);

    return (
        <Card
            classNames={{ card: styles.createPr, footer: styles.footer }}
            header={
                <h4>
                    PR für{' '}
                    <Badge noPaddingLeft>
                        <Icon path={mdiSourceBranch} color="var(--ifm-color-blue)" size={0.6} />
                        {branch.name}
                    </Badge>{' '}
                    erstellen
                </h4>
            }
            footer={
                <div className={clsx('button-group', 'button-group--block')}>
                    <Button
                        onClick={() => {
                            props.onDiscard();
                        }}
                        icon={mdiClose}
                        color="black"
                        iconSide="left"
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={() => {
                            if (!cmsStore.github) {
                                return props.onDone();
                            }
                            setIsCreating(true);
                            const prTitle = createPreview
                                ? withPreviewPRName(title)
                                : withoutPreviewPRName(title);
                            cmsStore.github.createPR(branch.name, prTitle, body).then((pr) => {
                                if (pr) {
                                    pr.sync(true);
                                    props.onDone(pr);
                                } else {
                                    setIsError(true);
                                    setIsCreating(false);
                                }
                            });
                        }}
                        title={isError ? 'Fehler beim Erstellen' : 'Erstelle neuen PR'}
                        spin={isCreating}
                        disabled={isError}
                        icon={isError ? mdiFlashTriangle : mdiRecordCircleOutline}
                        color={isError ? 'ref' : 'green'}
                        iconSide="right"
                    >
                        {isError ? 'Fehler' : 'PR Erstellen'}
                    </Button>
                </div>
            }
        >
            {isError && (
                <Alert type="danger" title="Fehler beim Erstellen">
                    Es ist ein Fehler beim Erstellen des PR aufgetreten. Laden Sie die Seite neu und versuchen
                    Sie es erneut.
                </Alert>
            )}
            <TextInput value={title} onChange={setTitle} label="Titel" />
            <TextAreaInput onChange={setBody} placeholder="Beschreibung" minRows={3} label="Beschreibung" />
            <Checkbox
                label="Seitenvorschau erstellen?"
                checked={createPreview}
                onChange={(checked) => setCreatePreview(checked)}
            />
        </Card>
    );
});

export default NewPR;
