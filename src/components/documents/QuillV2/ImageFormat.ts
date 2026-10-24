import BaseImageFormat from 'quill/formats/image';

class ImageFormat extends BaseImageFormat {
    static formats(domNode: Element): Record<string, string> {
        const formats: Record<string, string> = {};
        // Include the selection marker only when reading local editor state.
        ['alt', 'height', 'width', 'style', 'data-selected'].forEach((attribute) => {
            if (domNode.hasAttribute(attribute)) {
                formats[attribute] = domNode.getAttribute(attribute)!;
            }
        });
        return formats;
    }

    format(name: string, value: string) {
        if (!['alt', 'height', 'width', 'style'].includes(name)) {
            return super.format(name, value);
        }
        if (value) {
            this.domNode.setAttribute(name, value);
        } else {
            this.domNode.removeAttribute(name);
        }
    }
}

export default ImageFormat;
