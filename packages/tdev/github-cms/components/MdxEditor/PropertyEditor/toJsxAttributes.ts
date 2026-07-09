import { transformAttributes } from '@tdev-plugins/helpers';

export const toJsxAttributes = (values: Record<string, string>) => {
    return transformAttributes(values).jsxAttributes;
};
