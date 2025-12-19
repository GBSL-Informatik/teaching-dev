import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '@tdev-components/shared/Button';
import { mdiPlusCircle, mdiSortAscending, mdiSortDescending } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import _ from 'es-toolkit/compat';
import { Delete } from '@tdev-components/shared/Button/Delete';
import { action } from 'mobx';
import Details from '@theme/Details';
import TextInput from '@tdev-components/shared/TextInput';
import SelectInput from '@tdev-components/shared/SelectInput';
import { DocumentType } from '@tdev-api/document';

const SIZE_S = 0.6;

type SortColumn = 'id' | 'documentType' | 'action';
interface Props {
    className?: string;
}

const AllowedActions = observer((props: Props) => {
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [sortColumn, _setSortColumn] = React.useState<SortColumn>('documentType');
    const adminStore = useStore('adminStore');
    const documentStore = useStore('documentStore');
    const [newAction, setNewAction] = React.useState('');
    const [newDocType, setNewDocType] = React.useState<DocumentType | undefined>(undefined);

    const setSortColumn = (column: SortColumn) => {
        if (column === sortColumn) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortDirection('asc');
            _setSortColumn(column);
        }
    };

    const icon = sortDirection === 'asc' ? mdiSortAscending : mdiSortDescending;
    return (
        <div className={clsx(styles.userTable, props.className)}>
            <Details summary={<summary>Neue Aktion Hinzufügen</summary>}>
                <div className={clsx(styles.newAction)}>
                    <TextInput
                        onChange={(text) => setNewAction(text)}
                        value={newAction}
                        placeholder="Aktion"
                    />
                    <SelectInput
                        onChange={(docType) => setNewDocType(docType as DocumentType)}
                        options={['', ...documentStore.documentTypes]}
                        value={newDocType || ''}
                    />
                    <Button
                        text="Hinzufügen"
                        onClick={() => {
                            if (!newDocType || !newAction) {
                                return;
                            }
                            adminStore.createAllowedAction(newAction as `update@${string}`, newDocType);
                            setNewAction('');
                            setNewDocType(undefined);
                        }}
                        disabled={!(newDocType && newAction)}
                        color="green"
                        icon={mdiPlusCircle}
                    />
                </div>
            </Details>
            <div className={clsx(styles.tableWrapper)}>
                <table className={clsx(styles.table)}>
                    <thead>
                        <tr>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'id' && icon}
                                    text="ID"
                                    onClick={() => setSortColumn('id')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'documentType' && icon}
                                    text="Dokumenttyp"
                                    onClick={() => setSortColumn('documentType')}
                                />
                            </th>
                            <th>
                                <Button
                                    size={SIZE_S}
                                    iconSide="left"
                                    icon={sortColumn === 'action' && icon}
                                    text={'Aktion'}
                                    onClick={() => setSortColumn('action')}
                                />
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {_.orderBy(adminStore.allowedActions, [sortColumn], [sortDirection]).map((a, idx) => {
                            return (
                                <tr key={a.id}>
                                    <td>{a.id}</td>
                                    <td>
                                        <span className="badge badge--primary">{a.documentType}</span>
                                    </td>
                                    <td>
                                        <span className="badge badge--secondary">{a.action}</span>
                                    </td>
                                    <td>
                                        <Delete
                                            onDelete={action(() => {
                                                adminStore.destroyAllowedAction(a.id);
                                            })}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default AllowedActions;
