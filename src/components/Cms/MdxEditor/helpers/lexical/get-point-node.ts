/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/index.ts
 *
 */

import { $isElementNode, ElementNode, Point, type LexicalNode } from 'lexical';

export function $getPointNode(point: Point, offset: number): LexicalNode | null {
    if (point.type === 'element') {
        const node = point.getNode();
        if (!$isElementNode(node) && process.env.NODE_ENV !== 'production') {
            throw new Error('$getPointNode: element point is not an ElementNode');
        }
        const childNode = (node as ElementNode).getChildren()[point.offset + offset];
        return childNode || null;
    }
    return null;
}
