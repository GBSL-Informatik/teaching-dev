import { describe, expect, it } from 'vitest';
import {
    DirectiveBreak,
    DirectiveCard,
    DirectiveFlex
} from '../../../../../../src/plugins/remark-flex-cards/plugin';
import { LeafDirectiveName } from '../../../../../../src/plugins/remark-media/mediaElement';
import { CONTAINER_DIRECTIVES, LEAF_DIRECTIVES } from '../directiveNames';

describe('directive names', () => {
    it('contains the directives exported by the remark plugins', () => {
        expect(CONTAINER_DIRECTIVES).toEqual(expect.arrayContaining([DirectiveCard, DirectiveFlex]));
        expect(LEAF_DIRECTIVES).toEqual(
            expect.arrayContaining([DirectiveBreak, ...Object.values(LeafDirectiveName)])
        );
    });
});
