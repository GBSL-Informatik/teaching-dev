import Translate, { translate } from '@docusaurus/Translate';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const CommitForm = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const [message, setMessage] = React.useState('');
    const canSubmit = code.hasUncommittedChanges && message.trim().length > 0 && !code.isCommitting;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value);
    const handleCommit = () => {
        if (!canSubmit) {
            return;
        }
        code.createCommit(message).then((commit) => {
            if (commit) {
                setMessage('');
            }
        });
    };

    return (
        <div className={styles.commitForm}>
            <textarea
                className={styles.messageInput}
                rows={2}
                value={message}
                onChange={handleChange}
                placeholder={translate({
                    id: 'CodeCommits.Form.Placeholder',
                    message: 'Beschreibung der Änderungen'
                })}
            />
            <button
                type="button"
                className={clsx('button', 'button--primary', 'button--sm')}
                onClick={handleCommit}
                disabled={!canSubmit}
            >
                <Translate id="CodeCommits.Form.Submit">Commit</Translate>
            </button>
        </div>
    );
});

export default CommitForm;
