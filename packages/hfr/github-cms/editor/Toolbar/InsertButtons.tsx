import { mdiImageOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type MdxDocument from '../models/MdxDocument';
import { ADMONITION_ITEM, FLEX_ITEM, ICON_ITEM, insertCommand, type MenuItem } from './insertItems';
import styles from './styles.module.scss';

interface Props {
    document: MdxDocument;
}

/** the most used items of the insert menu, see `InsertMenu` */
const ITEMS: MenuItem[] = [ADMONITION_ITEM, FLEX_ITEM, ICON_ITEM];

const InsertButtons = observer(({ document }: Props) => {
    return (
        <div className={clsx(styles.group)}>
            <Button
                icon={mdiImageOutline}
                size={SIZE_S}
                title="Bild"
                disabled={!document.canInsertImage}
                onClick={() => document.setImageDialogOpen(true)}
            />
            {ITEMS.map((item) => (
                <Button
                    key={item.label}
                    icon={item.icon}
                    size={SIZE_S}
                    title={item.label}
                    disabled={!document.canRun(insertCommand(item))}
                    onClick={() => document.run(insertCommand(item))}
                />
            ))}
        </div>
    );
});

export default InsertButtons;
