import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as DirModel } from '@tdev-models/cms/Dir';
import Card from '@tdev-components/shared/Card';
import Dir from '@tdev-components/Cms/Github/iFile/Dir';

interface Props {
    dir?: DirModel;
}

const Directory = observer((props: Props) => {
    const { dir } = props;
    React.useEffect(() => {
        if (dir && !dir.isOpen) {
            dir.setOpen(true);
        }
    }, [dir]);
    if (!dir) {
        return null;
    }

    return (
        <div className={clsx(styles.directory)}>
            <Card
                classNames={{
                    body: styles.cardBody
                }}
            >
                <ul className={clsx(styles.dirTree)}>
                    <Dir dir={dir} />
                </ul>
            </Card>
        </div>
    );
});

export default Directory;
