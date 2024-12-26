import { useClientLib } from '@tdev-hooks/useClientLib';
import type { InitOptions } from 'decap-cms-core';
import React from 'react';

const config: InitOptions = {
    config: {
        backend: {
            name: 'github',
            branch: 'main',
            repo: 'GBSL-Informatik/teaching-dev'
        },
        media_folder: 'static/img',
        // media_folder: '{{media_folder_path}}/{{media_folder_relative_path}}',
        public_folder: '/img/',
        collections: [
            {
                name: 'docs',
                label: 'Docs',
                label_singular: 'Doc',
                folder: 'docs',
                identifier_field: 'name',
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

const DecapCms = () => {
    const Lib = useClientLib(() => import('decap-cms-app'), 'decap-cms-app');
    React.useEffect(() => {
        if (Lib) {
            (window as any).CMS_MANUAL_INIT = true;
            // Lib.default.registerPreviewTemplate("my-template", MyTemplate);
            Lib.default.init(config);
        }
    }, [Lib]);
    return <div id="nc-root">DECAP CMS</div>;
};
export default DecapCms;
