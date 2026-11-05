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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
        <form className={styles.commitForm} onSubmit={handleSubmit}>
            <input
                className={styles.messageInput}
                type="text"
                value={message}
                onChange={handleChange}
                placeholder={translate({
                    id: 'CodeCommits.Form.Placeholder',
                    message: 'Beschreibung der Änderungen'
                })}
            />
            <button
                type="submit"
                className={clsx('button', 'button--primary', 'button--sm')}
                disabled={!canSubmit}
            >
                <Translate id="CodeCommits.Form.Submit">Commit</Translate>
            </button>
        </form>
    );
});

export default CommitForm;
