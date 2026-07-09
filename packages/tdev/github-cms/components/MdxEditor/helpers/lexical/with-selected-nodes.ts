/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/index.ts
 */

import { $getSelection, $isRangeSelection, $normalizeSelection__EXPERIMENTAL, $setSelection } from 'lexical';
import { $getPointNode } from './get-point-node';

/**
 * Preserve the logical start/end of a RangeSelection in situations where
 * the point is an element that may be reparented in the callback.
 *
 * @param $fn The function to run
 * @returns The result of the callback
 */
export function $withSelectedNodes<T>($fn: () => T): T {
    const initialSelection = $getSelection();
    if (!$isRangeSelection(initialSelection)) {
        return $fn();
    }
    const normalized = $normalizeSelection__EXPERIMENTAL(initialSelection);
    const isBackwards = normalized.isBackward();
    const anchorNode = $getPointNode(normalized.anchor, isBackwards ? -1 : 0);
    const focusNode = $getPointNode(normalized.focus, isBackwards ? 0 : -1);
    const rval = $fn();
    if (anchorNode || focusNode) {
        const updatedSelection = $getSelection();
        if ($isRangeSelection(updatedSelection)) {
            const finalSelection = updatedSelection.clone();
            if (anchorNode) {
                const anchorParent = anchorNode.getParent();
                if (anchorParent) {
                    finalSelection.anchor.set(
                        anchorParent.getKey(),
                        anchorNode.getIndexWithinParent() + (isBackwards ? 1 : 0),
                        'element'
                    );
                }
            }
            if (focusNode) {
                const focusParent = focusNode.getParent();
                if (focusParent) {
                    finalSelection.focus.set(
                        focusParent.getKey(),
                        focusNode.getIndexWithinParent() + (isBackwards ? 0 : 1),
                        'element'
                    );
                }
            }
            $setSelection($normalizeSelection__EXPERIMENTAL(finalSelection));
        }
    }
    return rval;
}
