import { useHistory } from '@docusaurus/router';
import { reaction } from 'mobx';
import React from 'react';
import { cmsUrl } from '../models/cmsLocation';
import { useCmsStore } from './useCmsStore';

/**
 * Applies the navigations requested by the cms store to the url, see `CmsStore.navigateTo`.
 */
export const useRequestedNavigation = () => {
    const cmsStore = useCmsStore();
    const history = useHistory();
    React.useEffect(() => {
        return reaction(
            () => cmsStore.requestedNavigation,
            (navigation) => {
                if (!navigation) {
                    return;
                }
                const url = cmsUrl(navigation.location);
                const { pathname, search } = history.location;
                if (url === `${pathname}${search}`) {
                    return;
                }
                if (navigation.replace) {
                    history.replace(url);
                } else {
                    history.push(url);
                }
            }
        );
    }, [cmsStore, history]);
};
