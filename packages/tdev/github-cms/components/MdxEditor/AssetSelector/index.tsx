import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '@tdev/github-cms/hooks/useCmsStore';
import Card from '@tdev-components/shared/Card';
import iFile from '@tdev/github-cms/models/iFile';
import Dir from '@tdev/github-cms/components/Github/iFile/Dir';
import Button from '@tdev-components/shared/Button';
import { mdiFolderArrowLeftOutline, mdiFolderArrowUpOutline } from '@mdi/js';

interface Props<T extends iFile = iFile> {
    onSelect: (entry: T) => void;
    filter: (entry: iFile) => entry is T;
    header?: string;
    className?: string;
}

const AssetSelector = observer((props: Props) => {
    const cmsStore = useCmsStore();
    const { viewStore } = cmsStore;
    const { assetEntrypoint } = viewStore;
    React.useEffect(() => {
        // always start with the active file as the entrypoint
        viewStore.setAssetEntrypoint(null);
    }, []);

    if (!assetEntrypoint) {
        return null;
    }
    return (
        <div className={clsx(styles.assets, props.className)}>
            {props.header && (
                <div className={clsx(styles.header)}>
                    <h4>{props.header}</h4>
                </div>
            )}
            <div className={clsx(styles.selector)}>
                <div className={clsx(styles.pathNav)}>
                    <div className={clsx(styles.path)}>{assetEntrypoint.path}</div>
                    <Button
                        icon={mdiFolderArrowUpOutline}
                        title="Verzeichnis oberhalb öffnen"
                        onClick={() => {
                            viewStore.setAssetEntrypoint(assetEntrypoint.parent);
                        }}
                        color="primary"
                        disabled={!assetEntrypoint.parent || assetEntrypoint.parent.path === ''}
                    />
                </div>
                <Dir
                    dir={assetEntrypoint}
                    filter={props.filter}
                    useLocalMode
                    expandedOnLoad
                    expandedByDefault={['images', 'img']}
                    hideEmpty
                    showActions="never"
                    onSelect={props.onSelect}
                />
            </div>
        </div>
    );
});

export default AssetSelector;
