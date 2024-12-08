import React from 'react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import clsx from 'clsx';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import UserTable from '@tdev-components/Admin/UserTable';
import Button from '@tdev-components/shared/Button';
import SelectUser from '@tdev-components/Admin/SelectUser';

interface Props {
    onDone: (data: string[][]) => void;
    onClose: () => void;
    cancelIcon?: string;
    cancelLabel?: string;
    importLabel?: string;
}

const CodeImport = observer((props: Props) => {
    const [code, setCode] = React.useState<string>('');
    const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
    return (
        <div className={clsx(styles.codeImport, 'card')}>
            <div className="card__header">
                <h3>Code Import</h3>
            </div>
            <div className="card__body">
                <div className={clsx(styles.main)}>
                    <SelectUser
                        mode="multiple"
                        onChange={(ids) => setSelectedUserIds(ids)}
                        tableClassName={clsx(styles.userTable)}
                        className={clsx(styles.userSelect)}
                    />
                    <div className={clsx(styles.input)}>
                        <CodeEditor aceClassName={clsx(styles.editor)} onChange={(raw) => setCode(raw)} />
                    </div>
                </div>
            </div>
            <div className="card__footer">
                <div className={clsx('button-group', 'button-group--block')}>
                    <Button
                        text={props.cancelIcon ? (undefined as any) : props.cancelLabel || 'Abbrechen'}
                        onClick={() => {
                            props.onClose();
                        }}
                        icon={props.cancelIcon}
                        title={props.cancelIcon ? props.cancelLabel || 'Abbrechen' : undefined}
                        color="black"
                    />
                    <Button
                        text={props.importLabel || 'Importieren'}
                        onClick={() => {
                            if (selectedUserIds.length === 0) {
                                return;
                            }
                            const table = [
                                ['User ID', 'Code'],
                                ...selectedUserIds.map((userId) => {
                                    return [userId, code];
                                })
                            ];
                            props.onDone(table);
                        }}
                        disabled={selectedUserIds.length === 0}
                        color="primary"
                    />
                </div>
            </div>
        </div>
    );
});

export default CodeImport;
