import type { WrapperProps } from '@docusaurus/types';
import { useStore } from '@tdev-hooks/useStore';
import TaskableState from '@tdev/page-index/components/TaskableState';
import DocSidebarItem from '@theme-original/DocSidebarItem';
import type DocSidebarItemType from '@theme/DocSidebarItem';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { type ReactNode } from 'react';
import styles from './styles.module.scss';
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
            <TaskableState
                page={page}
                className={clsx(styles.icon, styles[props.item.type])}
                forcedAction={props.item.customProps?.taskable_state as 'show' | 'hide'}
            />
        </div>
    );
});

export default DocSidebarItemWrapper;
