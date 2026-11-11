import type { MediaAttributeValue, MediaElement } from '@tdev-plugins/remark-media/mediaElement';
import React from 'react';

interface Props {
    element: MediaElement;
    /** the url of the required file, e.g. of the `<source>` of a video */
    resolvedSrc: string;
}

/** in mdx, an empty string is an attribute without value, e.g. `<audio controls>` */
const toReactProps = (attributes: Record<string, MediaAttributeValue>) =>
    Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, value === '' ? true : value]));

const MediaElementView = ({ element, resolvedSrc }: Props): React.ReactElement => {
    const props = toReactProps(element.attributes);
    if (element.requiredSrc) {
        props.src = resolvedSrc;
    }
    const children = element.children.map((child, index) => (
        <MediaElementView key={index} element={child} resolvedSrc={resolvedSrc} />
    ));
    return React.createElement(element.name, props, ...children);
};

export default MediaElementView;
