import {
    mdiFormatAlignCenter,
    mdiFormatAlignLeft,
    mdiFormatAlignRight,
    mdiTableColumnPlusAfter,
    mdiTableColumnRemove,
    mdiTableRemove,
    mdiTableRowPlusAfter,
    mdiTableRowRemove
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { Command } from 'prosemirror-state';
import { addColumnAfter, addRowAfter, deleteColumn, deleteRow, deleteTable } from 'prosemirror-tables';
import { setColumnAlign } from '../commands';
import type MdxDocument from '../models/MdxDocument';
import styles from './styles.module.scss';

const ACTIONS: { icon: string; title: string; command: Command; color?: string }[] = [
    { icon: mdiTableRowPlusAfter, title: 'Zeile einfügen', command: addRowAfter },
    { icon: mdiTableColumnPlusAfter, title: 'Spalte einfügen', command: addColumnAfter },
    { icon: mdiFormatAlignLeft, title: 'Spalte linksbündig', command: setColumnAlign('left') },
    { icon: mdiFormatAlignCenter, title: 'Spalte zentriert', command: setColumnAlign('center') },
    { icon: mdiFormatAlignRight, title: 'Spalte rechtsbündig', command: setColumnAlign('right') },
    { icon: mdiTableRowRemove, title: 'Zeile löschen', command: deleteRow, color: 'red' },
    { icon: mdiTableColumnRemove, title: 'Spalte löschen', command: deleteColumn, color: 'red' },
    { icon: mdiTableRemove, title: 'Tabelle löschen', command: deleteTable, color: 'red' }
];

const TableActions = observer(({ document }: { document: MdxDocument }) => {
    return (
        <div className={clsx(styles.group)}>
            {ACTIONS.map((action) => (
                <Button
                    key={action.title}
                    icon={action.icon}
                    title={action.title}
                    size={SIZE_S}
                    color={action.color}
                    disabled={!document.canRun(action.command)}
                    onClick={() => document.run(action.command)}
                />
            ))}
        </div>
    );
});

export default TableActions;
