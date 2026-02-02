import React, { type ReactNode } from 'react';
import DocSidebarItem from '@theme-original/DocSidebarItem';
import type DocSidebarItemType from '@theme/DocSidebarItem';
import type { WrapperProps } from '@docusaurus/types';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import styles from './styles.module.scss';
import TaskableState from './TaskableState';
const ensureTrailingSlash = (path?: string) => {
    if (!path) {
        return '';
    }
    return path.endsWith('/') ? path : path + '/';
};

type Props = WrapperProps<typeof DocSidebarItemType>;
const DocSidebarItemWrapper = observer((props: Props): ReactNode => {
    const pageStore = useStore('pageStore');
    const path = props.item.type !== 'html' ? ensureTrailingSlash(props.item.href) : undefined;
    const page = pageStore.pages.find((p) => p.path === path);
    return (
        <div className={clsx(styles.item)}>
            <DocSidebarItem {...props} />
            <TaskableState page={page} className={clsx(styles.icon, styles[props.item.type])} />
        </div>
    );
});

export default DocSidebarItemWrapper;
