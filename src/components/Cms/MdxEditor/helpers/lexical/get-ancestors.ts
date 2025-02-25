/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/index.ts
 *
 */

import type { LexicalNode } from 'lexical';

export function $getAncestor<NodeType extends LexicalNode = LexicalNode>(
    node: LexicalNode,
    predicate: (ancestor: LexicalNode) => ancestor is NodeType
) {
    let parent = node;
    while (parent !== null && parent.getParent() !== null && !predicate(parent)) {
        parent = parent.getParentOrThrow();
    }
    return predicate(parent) ? parent : null;
}
