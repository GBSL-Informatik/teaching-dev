import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as DirModel } from '@site/packages/hfr/github-cms/models/Dir';
import Card from '@tdev-components/shared/Card';
import Dir from '@site/packages/hfr/github-cms/components/Github/iFile/Dir';
import UserAvatar from '@site/packages/hfr/github-cms/components/Github/AccountOptions/UserAvatar';

interface Props {
    dir?: DirModel;
    className?: string;
    contentClassName?: string;
    showActions?: 'always' | 'hover';
    compact?: boolean;
    showAvatar?: boolean;
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
        <div className={clsx(styles.directory, props.className, props.compact && styles.compact)}>
            {props.showAvatar && <UserAvatar showOptions />}
            <Card
                classNames={{
                    body: styles.cardBody,
                    card: props.contentClassName
                }}
            >
                <ul className={clsx(styles.dirTree)}>
                    <Dir dir={dir} showActions={props.showActions} />
                </ul>
            </Card>
        </div>
    );
});

export default Directory;
