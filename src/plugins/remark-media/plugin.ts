import { visit } from 'unist-util-visit';
import type { Plugin, Processor, Transformer } from 'unified';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import type { LeafDirective } from 'mdast-util-directive';
import { requireDefaultMdastNode, toJsxAttribute, transformAttributes } from '../helpers';
import { Link, Parent, Text } from 'mdast';

enum LeafDirectiveName {
    VIDEO = 'video',
    AUDIO = 'audio',
    YOUTUBE = 'youtube',
    CIRCUITVERSE = 'circuitverse'
}
const DirectiveNames = Object.values(LeafDirectiveName) as string[];

const plugin: Plugin = function plugin(this: Processor, optionsInput?: {}): Transformer {
    return async (ast, vfile) => {
        visit(ast, (node, idx, parent: Parent) => {
            if (
                node.type !== 'leafDirective' ||
                !DirectiveNames.includes((node as unknown as LeafDirective).name)
            ) {
                return;
            }
            const directive = node as unknown as LeafDirective;
            const { attributes, className, style } = transformAttributes((directive.attributes as any) || {});
            const newNode: MdxJsxFlowElement = {
                type: 'mdxJsxFlowElement',
                name: '',
                attributes: [],
                children: [],
                data: {}
            };
            const rawChild = directive.children[0];
            const src =
                rawChild.type === 'text'
                    ? (rawChild as Text).value
                    : rawChild.type === 'link'
                      ? (rawChild as Link).url
                      : undefined;
            if (!src) {
                throw new Error(`Invalid child for ${directive.name} directive in ${vfile.path}`);
            }
            switch (directive.name) {
                case LeafDirectiveName.VIDEO:
                    newNode.name = 'video';
                    if (attributes.autoplay || attributes.autoplay === '') {
                        newNode.attributes.push(toJsxAttribute('autoPlay', ''));
                        newNode.attributes.push(toJsxAttribute('playsInline', ''));
                    }
                    if (attributes.muted || attributes.muted === '') {
                        newNode.attributes.push(toJsxAttribute('muted', attributes.muted));
                    }
                    if (attributes.loop || attributes.loop === '') {
                        newNode.attributes.push(toJsxAttribute('loop', attributes.loop));
                    }
                    newNode.attributes.push(toJsxAttribute('style', { maxWidth: '100%', ...style }));
                    newNode.attributes.push(toJsxAttribute('controls', ''));
                    newNode.children.push({
                        type: 'mdxJsxFlowElement',
                        name: 'source',
                        attributes: [requireDefaultMdastNode('src', src)],
                        children: [],
                        data: {}
                    });
                    break;
                case LeafDirectiveName.AUDIO:
                    newNode.name = 'audio';
                    newNode.attributes.push(toJsxAttribute('controls', ''));
                    newNode.children.push({
                        type: 'mdxJsxFlowElement',
                        name: 'source',
                        attributes: [
                            requireDefaultMdastNode('src', src),
                            toJsxAttribute('type', 'audio/mpeg')
                        ],
                        children: [],
                        data: {}
                    });
                    break;
                case LeafDirectiveName.YOUTUBE:
                    newNode.name = 'iframe';
                    newNode.attributes.push(toJsxAttribute('width', style.width || '100%'));
                    newNode.attributes.push(toJsxAttribute('height', style.height || '315px'));
                    newNode.attributes.push(toJsxAttribute('src', src));
                    newNode.attributes.push(toJsxAttribute('title', 'YouTube video player'));
                    newNode.attributes.push(toJsxAttribute('frameBorder', '0'));
                    newNode.attributes.push(
                        toJsxAttribute(
                            'allow',
                            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        )
                    );
                    newNode.attributes.push(toJsxAttribute('allowFullScreen', ''));
                    break;
                case LeafDirectiveName.CIRCUITVERSE:
                    newNode.name = 'iframe';
                    newNode.attributes.push(toJsxAttribute('width', style.width || '100%'));
                    newNode.attributes.push(toJsxAttribute('height', style.height || '315px'));
                    newNode.attributes.push(toJsxAttribute('src', src));
                    newNode.attributes.push(toJsxAttribute('title', 'Circuit Verse'));
                    newNode.attributes.push(toJsxAttribute('frameBorder', '0'));
                    newNode.attributes.push(toJsxAttribute('scrolling', 'no'));
                    newNode.attributes.push(toJsxAttribute('webkitAllowFullScreen', ''));
                    newNode.attributes.push(toJsxAttribute('mozAllowFullScreen', ''));
                    newNode.attributes.push(toJsxAttribute('allowFullScreen', ''));
                    break;
            }

            parent.children.splice(idx || 0, 1, newNode);
        });
    };
};

export default plugin;
