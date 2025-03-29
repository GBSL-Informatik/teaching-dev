/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import { DirectiveDescriptor } from '@mdxeditor/editor';
import { ContainerDirective } from 'mdast-util-directive';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Admonition from '@theme/Admonition';
import { observer } from 'mobx-react-lite';
import { ADMONITION_TYPES } from './AdmonitionTypeSelector/admonitionTypes';
import AdmonitionBody from './AdmonitionBody';
import AdmonitionHeader from './AdmonitionHeader';

/** @internal */
export type AdmonitionKind = (typeof ADMONITION_TYPES)[number];

/**
 * Pass this descriptor to the `directivesPlugin` `directiveDescriptors` parameter to enable {@link https://docusaurus.io/docs/markdown-features/admonitions | markdown admonitions}.
 *
 * @example
 * ```tsx
 * <MDXEditor
 *  plugins={[
 *   directivesPlugin({ directiveDescriptors: [ AdmonitionDirectiveDescriptor] }),
 *  ]} />
 * ```
 * @group Directive
 */
export const AdmonitionDirectiveDescriptor: DirectiveDescriptor = {
    name: 'admonition',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return ADMONITION_TYPES.includes(node.name as AdmonitionKind);
    },
    Editor: observer(({ mdastNode, lexicalNode, parentEditor }) => {
        return (
            <Admonition
                type={mdastNode.name}
                className={clsx(styles.admonition)}
                title={
                    <AdmonitionHeader
                        mdastNode={mdastNode as ContainerDirective}
                        lexicalNode={lexicalNode}
                        parentEditor={parentEditor}
                    />
                }
            >
                <AdmonitionBody
                    mdastNode={mdastNode as ContainerDirective}
                    lexicalNode={lexicalNode}
                    parentEditor={parentEditor}
                />
            </Admonition>
        );
    })
};
