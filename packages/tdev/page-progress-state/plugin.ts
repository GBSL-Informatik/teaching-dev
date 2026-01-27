import { LoadContext, Plugin, PluginModule } from '@docusaurus/types';
import { Joi } from '@docusaurus/utils-validation';
import fs from 'fs-extra';
import path from 'path';

const persistableDocuments: PluginModule = (context: LoadContext) => {
    const isHashRouter = context.siteConfig.future?.experimental_router === 'hash';
    return {
        name: 'tdev-persistable-documents',
        async loadContent() {
            console.log('Calling persistable-documents plugin loadContent');
            return {};
        },
        async contentLoaded({ actions: { setGlobalData } }) {
            console.log('Calling persistable-documents plugin contentLoaded');
        },

        async postBuild({ siteConfig = {}, routesPaths = [], outDir }) {
            // Print out to console all the rendered routes.
            routesPaths.map((route) => {
                console.log(route);
            });
        }
    };
};

export default persistableDocuments;
