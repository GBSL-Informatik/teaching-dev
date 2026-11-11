import { transformAttributes } from '../helpers';

export enum LeafDirectiveName {
    VIDEO = 'video',
    AUDIO = 'audio',
    YOUTUBE = 'youtube',
    CIRCUITVERSE = 'circuitverse',
    LEARNINGAPPS = 'learningapps',
    CODEPEN = 'codepen'
}
const DIRECTIVE_NAMES = Object.values(LeafDirectiveName) as string[];

export const isMediaDirective = (name: string): name is LeafDirectiveName => DIRECTIVE_NAMES.includes(name);

/** an empty string is an attribute without value, e.g. `controls` */
export type MediaAttributeValue = string | number | boolean | object;

/**
 * The html element rendered for a media directive. It is converted to mdx by the plugin
 * and rendered as a preview by the github-cms editor.
 */
export interface MediaElement {
    name: string;
    attributes: Record<string, MediaAttributeValue>;
    children: MediaElement[];
    /** the `src` of the file, bundled as an asset by `require(src)` */
    requiredSrc?: string;
}

type DirectiveAttributes = Parameters<typeof transformAttributes>[0];

/** throws for an invalid `src` of an embed, e.g. a learningapps url */
export const mediaElement = (
    name: LeafDirectiveName,
    src: string,
    directiveAttributes: DirectiveAttributes
): MediaElement => {
    const { attributes, style } = transformAttributes(directiveAttributes || {});
    switch (name) {
        case LeafDirectiveName.VIDEO:
            return video(src, attributes, style);
        case LeafDirectiveName.AUDIO:
            return audio(src, style);
        case LeafDirectiveName.YOUTUBE:
            return youtube(src, style);
        case LeafDirectiveName.CIRCUITVERSE:
            return iframe('Circuit Verse', src, style, '315px');
        case LeafDirectiveName.LEARNINGAPPS:
            return iframe('Learningapps', learningappsSrc(src), style, '500px');
        case LeafDirectiveName.CODEPEN:
            return codepen(codepenSrc(src, attributes), style);
    }
};

type Attributes = ReturnType<typeof transformAttributes>['attributes'];
type Style = ReturnType<typeof transformAttributes>['style'];

const element = (
    name: string,
    attributes: MediaElement['attributes'],
    children: MediaElement[] = []
): MediaElement => ({ name, attributes, children });

const video = (src: string, attributes: Attributes, style: Style) => {
    const videoAttributes: MediaElement['attributes'] = {};
    if (attributes.autoplay || attributes.autoplay === '') {
        videoAttributes.autoPlay = '';
        videoAttributes.playsInline = '';
    }
    if (attributes.muted || attributes.muted === '') {
        videoAttributes.muted = attributes.muted;
    }
    if (attributes.loop || attributes.loop === '') {
        videoAttributes.loop = attributes.loop;
    }
    videoAttributes.style = { maxWidth: '100%', ...style };
    if (!('controls' in attributes) || attributes.controls) {
        videoAttributes.controls = '';
    }
    return element('video', videoAttributes, [{ ...element('source', {}), requiredSrc: src }]);
};

const audio = (src: string, style: Style) => {
    const audioAttributes: MediaElement['attributes'] = { controls: '' };
    if (Object.keys(style).length > 0) {
        audioAttributes.style = style;
    }
    return element('audio', audioAttributes, [
        { ...element('source', { type: 'audio/mpeg' }), requiredSrc: src }
    ]);
};

const youtube = (src: string, style: Style) => {
    const player = element('iframe', {
        width: style.minWidth || '100%',
        height: style.height || '100%',
        src,
        title: 'YouTube video player',
        frameBorder: '0',
        allowFullScreen: '',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    });
    const centered = style.minWidth ? { marginLeft: 'auto', marginRight: 'auto', maxWidth: '100%' } : {};
    const wrapperStyle = {
        ...centered,
        width: style.minWidth ? style.minWidth : '100%',
        aspectRatio: style.height ? undefined : '16 / 9',
        ...style
    };
    return element('div', { style: wrapperStyle }, [player]);
};

const embedStyle = (style: Style) => ({
    width: style.minWidth ? style.minWidth : '100%',
    maxWidth: '100%',
    ...style
});

const iframe = (title: string, src: string, style: Style, defaultHeight: string) =>
    element('iframe', {
        height: style.height || defaultHeight,
        src,
        title,
        frameBorder: '0',
        scrolling: 'no',
        allowFullScreen: true,
        style: embedStyle(style)
    });

const codepen = (src: string, style: Style) =>
    element('iframe', {
        height: style.height || '500px',
        src,
        title: 'Codepen',
        scrolling: 'no',
        frameBorder: 'no',
        loading: 'lazy',
        allowTransparency: true,
        allowFullScreen: true,
        style: embedStyle(style)
    });

const learningappsSrc = (src: string) => {
    const appId = new URL(src).pathname.split('/')[1];
    return `https://learningapps.org/watch?app=${appId}`;
};

const codepenSrc = (src: string, attributes: Attributes) => {
    const pen = /codepen\.io\/.*\/pen\/.*/.test(src) ? src.replace(/\/pen\//, '/embed/') : src;
    const penSource = new URL(pen);
    penSource.searchParams.set('editable', 'true');
    if (attributes.theme) {
        penSource.searchParams.set('theme-id', `${attributes.theme}`);
    }
    if (attributes.defaultTab) {
        penSource.searchParams.set('default-tab', `${attributes.defaultTab}`);
    }
    if (attributes.editable !== undefined && !attributes.editable) {
        penSource.searchParams.delete('editable');
    }
    return penSource.toString();
};
