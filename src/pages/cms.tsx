import { useClientLib } from '@tdev-hooks/useClientLib';
// import CMS from 'decap-cms-app';
import type { InitOptions } from 'decap-cms-core';
import React from 'react';
// (window as any).CMS_MANUAL_INIT = true;
// Initialize the CMS object
const config: InitOptions = {
    config: {
        backend: {
            name: 'github',
            branch: 'main',
            repo: 'GBSL-Informatik/teaching-dev'
        },
        media_folder: 'static/img',
        public_folder: '/img/',
        collections: [
            {
                name: 'docs',
                label: 'Docs',
                label_singular: 'Doc',
                folder: 'docs',
                identifier_field: '{{filename}}',
                extension: 'mdx',
                format: 'frontmatter',
                create: true,
                nested: {
                    depth: 100
                },
                fields: [
                    { label: 'Title', name: 'title', widget: 'string' },
                    { label: 'Body', name: 'body', widget: 'markdown' }
                ],
                meta: {
                    path: {
                        widget: 'string',
                        label: 'Path',
                        index_file: 'index'
                    }
                }
            }
        ]
    }
};
// Now the registry is available via the CMS object.
// CMS.registerPreviewTemplate("my-template", MyTemplate);

const DecapCms = () => {
    const Lib = useClientLib(() => import('decap-cms-app'), 'decap-cms-app');
    React.useEffect(() => {
        if (Lib) {
            (window as any).CMS_MANUAL_INIT = true;
            Lib.default.init(config);
        }
    }, [Lib]);
    return <div id="nc-root">DECAP CMS</div>;
};
export default DecapCms;
