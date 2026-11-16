import { offlineRoutes } from '@tdev-api/OfflineApi';
import { rootStore } from '@tdev-stores/rootStore';
import ViewStore from '@tdev-stores/ViewStores';
import { CmsSettings } from './api/cms';
import { registerCmsRoutes } from './api/offlineRoutes';
import { CmsStore } from './stores/CmsStore';

const createStore = (viewStore: ViewStore) => {
    return new CmsStore(viewStore);
};

const handleSettingsChange = (settings: CmsSettings) => {
    rootStore.viewStore.useStore('cmsStore').handleSettingsChange(settings);
};

const register = () => {
    rootStore.viewStore.registerStore('cmsStore', createStore);
    rootStore.socketStore.registerRecordHandler('CmsSettings', {
        onNew: handleSettingsChange,
        onChanged: handleSettingsChange
    });
    registerCmsRoutes(offlineRoutes);
};

register();
