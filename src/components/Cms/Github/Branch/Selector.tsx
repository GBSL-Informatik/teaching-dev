import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { translate } from '@docusaurus/Translate';
import _ from 'es-toolkit/compat';

import CreatableSelect from 'react-select/creatable';
import { useStore } from '@tdev-hooks/useStore';
import Loader from '@tdev-components/Loader';

interface Props {
    onSelect: (name: string) => void;
}

const Selector = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { activeBranchName } = cmsStore;
    if (!activeBranchName) {
        return <Loader />;
    }
    return (
        <div>
            <CreatableSelect
                isClearable={false}
                isSearchable
                closeMenuOnSelect
                formatCreateLabel={(inputValue) => {
                    return `Neuer Branch: ${inputValue}`;
                }}
                name="github.branch"
                menuPortalTarget={document.body}
                options={cmsStore.branchNames.map((br) => ({
                    label: br,
                    value: br
                }))}
                styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 'var(--ifm-z-index-overlay)' }),
                    container: (base) => ({ ...base, minWidth: '15em' })
                }}
                className={clsx(styles.select)}
                onChange={(option) => {
                    if (option) {
                        props.onSelect(option.value);
                    }
                }}
                onCreateOption={(option) => {
                    props.onSelect(option);
                }}
                value={{ label: activeBranchName, value: activeBranchName }}
            />
        </div>
    );
});

export default Selector;
