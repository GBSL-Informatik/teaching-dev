/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Root } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import type { Plugin, Transformer } from 'unified';
import { toJsxAttribute } from '../helpers';

export interface PluginOptions {
    componentsToEnumerate?: string[];
}

/**
 * A remark plugin to enumerate components by adding an attribute `pagePosition`
 * to the specified components.
 * This is useful to sort components in the order they appear in the document.
 */
const plugin: Plugin<PluginOptions[], Root> = function plugin(options = {}): Transformer<Root> {
    return async (root, file) => {
        const { visit } = await import('unist-util-visit');
        const toEnumerate = new Set<string | null>(options?.componentsToEnumerate || ['Answer']);
        let pagePosition = 0;

        visit(root, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node) => {
            const answer = node as MdxJsxFlowElement | MdxJsxTextElement;
            if (!toEnumerate.has(answer.name)) {
                return;
            }
            pagePosition = pagePosition + 1;
            answer.attributes.push(toJsxAttribute('pagePosition', pagePosition));
        });
    };
};

export default plugin;
