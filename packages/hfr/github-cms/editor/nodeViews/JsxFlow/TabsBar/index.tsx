import { useComputed } from '@tdev-hooks/useComputed';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { withJsxAttributes, withStringAttributes } from '../../../jsxAttributes';
import { type TabItemChild, tabItems } from '../../../tabs';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';
import Tab from './Tab';

/** the tab with the cursor, else the last active tab, else the first tab */
const activeTabIndex = (tabs: TabItemChild[], selectedChild: number | null, lastActive: number | null) => {
    const isTab = (index: number | null) => tabs.some((tab) => tab.index === index);
    if (isTab(selectedChild)) {
        return selectedChild;
    }
    if (isTab(lastActive)) {
        return lastActive;
    }
    return tabs[0]?.index ?? null;
};

/**
 * The tab items of `<Tabs>` as tabs, like on the page: only the active tab item is shown,
 * see `ReactNodeView`. The active tab follows the cursor, clicking a tab moves the cursor into it.
 */
const TabsBar = observer(({ handle }: NodeViewProps) => {
    const selectedChild = useComputed(() => handle.childIndexOfSelection(), [handle]);
    const [lastActive, setLastActive] = React.useState<number | null>(null);
    const tabs = tabItems(handle.node);
    const activeChild = activeTabIndex(tabs, selectedChild, lastActive);

    React.useEffect(() => {
        setLastActive(activeChild);
        handle.setActiveChild(activeChild);
    }, [handle, activeChild]);
    React.useEffect(() => () => handle.setActiveChild(null), [handle]);

    const handleApply = (tab: TabItemChild, values: Record<string, string>) => {
        const attributes = withStringAttributes(tab.node.attrs.attributes, values);
        if (attributes === tab.node.attrs.attributes) {
            return;
        }
        handle.updateChildAttrs(tab.index, withJsxAttributes(tab.node, attributes));
    };

    return (
        // the tabs handle their clicks themselves, ProseMirror must not select the node
        <ul className={clsx('tabs', styles.tabsBar)} role="tablist" data-stop-event>
            {tabs.map((tab) => (
                <Tab
                    key={tab.index}
                    tabItem={tab.node}
                    isActive={tab.index === activeChild}
                    onSelect={() => handle.focusChild(tab.index)}
                    onApply={(values) => handleApply(tab, values)}
                />
            ))}
        </ul>
    );
});

export default TabsBar;
