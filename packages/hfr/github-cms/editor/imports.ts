import type { Node } from 'prosemirror-model';
import type { Command, Transaction } from 'prosemirror-state';
import { parseMdx } from './markdown/syntax';
import { schema } from './schema';

const { nodes } = schema;

/** a default import, e.g. `import BrowserWindow from '@tdev-components/BrowserWindow';` */
export interface ImportSpec {
    name: string;
    source: string;
}

/**
 * Runs the command and adds the imports to the same transaction, so all are undone together.
 */
export const withImports = (command: Command, specs: ImportSpec[]): Command => {
    return (state, dispatch, view) => {
        const addAllImports = (tr: Transaction) =>
            specs.reduce((current, spec) => addImport(current, spec), tr);
        const dispatchWithImports = dispatch && ((tr: Transaction) => dispatch(addAllImports(tr)));
        return command(state, dispatchWithImports, view);
    };
};

/**
 * Adds the import to the first esm block, or to a new one after the frontmatter.
 * Nothing is added when the name is already imported, even from another source:
 * the existing import is kept as the author wrote it.
 */
export const addImport = (tr: Transaction, spec: ImportSpec): Transaction => {
    const esmBlocks = findEsmBlocks(tr.doc);
    const isImported = esmBlocks.some(({ node }) => importedNames(node.textContent).includes(spec.name));
    if (isImported) {
        return tr;
    }

    const statement = `import ${spec.name} from '${spec.source}';`;
    const [firstBlock] = esmBlocks;
    if (firstBlock) {
        const contentEnd = firstBlock.pos + firstBlock.node.nodeSize - 1;
        return tr.insertText(`\n${statement}`, contentEnd);
    }
    const frontmatter = tr.doc.firstChild?.type === nodes.frontmatter ? tr.doc.firstChild : null;
    const esmBlock = nodes.raw_block.create({ kind: 'mdxjsEsm' }, schema.text(statement));
    return tr.insert(frontmatter?.nodeSize ?? 0, esmBlock);
};

const findEsmBlocks = (doc: Node) => {
    const blocks: { node: Node; pos: number }[] = [];
    doc.forEach((node, pos) => {
        if (node.type === nodes.raw_block && node.attrs.kind === 'mdxjsEsm') {
            blocks.push({ node, pos });
        }
    });
    return blocks;
};

const importedNames = (esmSource: string): string[] => {
    try {
        return parseMdx(esmSource).children.flatMap((node) => {
            const statements = node.type === 'mdxjsEsm' ? (node.data?.estree?.body ?? []) : [];
            return statements.flatMap((statement) =>
                statement.type === 'ImportDeclaration'
                    ? statement.specifiers.map((specifier) => specifier.local.name)
                    : []
            );
        });
    } catch {
        // the author is editing the block and it is not valid (yet): treat it as importing nothing
        return [];
    }
};
