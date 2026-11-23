import { CheckBase, CheckKind } from '../Check';

/** Settings of the whole document; a blank document has them all off. */
export interface DocumentSettingsCheck extends CheckBase<'documentSettings'> {
    expect: { autoHyphenation: boolean };
}

export const documentSettings: CheckKind<DocumentSettingsCheck> = {
    category: 'Dokument',
    anchors: 'none',

    extract: ({ original }) => {
        if (!original.autoHyphenation) {
            return [];
        }
        return [
            {
                kind: 'documentSettings',
                title: 'Automatische Silbentrennung',
                expect: { autoHyphenation: true }
            }
        ];
    },

    evaluate: (check, context) => {
        if (context.document.autoHyphenation === check.expect.autoHyphenation) {
            return [];
        }
        return [`Automatische Silbentrennung ist ${context.document.autoHyphenation ? 'ein' : 'aus'}`];
    }
};
