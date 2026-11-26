import type { ImportDeclaration } from 'estree';
import type { Node } from 'prosemirror-model';
import type { Command, Transaction } from 'prosemirror-state';
import { parseMdx } from './markdown/syntax';
import { schema } from './schema';

const { nodes } = schema;

/**
 * A default import, e.g. `import BrowserWindow from '@tdev-components/BrowserWindow';`,
 * or a named import, e.g. `import { points } from '.../scoring';`
 */
export interface ImportSpec {
    name: string;
    source: string;
    named?: boolean;
}

/**
 * Runs the command and adds the imports to the same transaction, so all are undone together.
 */
export const withImports = (command: Command, specs: ImportSpec[]): Command => {
    return (state, dispatch, view) => {
        const dispatchWithImports = dispatch && ((tr: Transaction) => dispatch(addImports(tr, specs)));
        return command(state, dispatchWithImports, view);
    };
};

export const addImports = (tr: Transaction, specs: ImportSpec[]): Transaction =>
    specs.reduce((current, spec) => addImport(current, spec), tr);

/**
 * Adds the import to the first esm block, or to a new one after the frontmatter.
 * A named import is added to an existing named import of the same source, e.g. `{ points, noPoints }`.
 * Nothing is added when the name is already imported, even from another source:
 * the existing import is kept as the author wrote it.
 */
export const addImport = (tr: Transaction, spec: ImportSpec): Transaction => {
    const esmBlocks = findEsmBlocks(tr.doc);
    const isImported = esmBlocks.some(({ node }) =>
        importDeclarations(node.textContent).some((declaration) =>
            importedNames(declaration).includes(spec.name)
        )
    );
    if (isImported) {
        return tr;
    }
    const lastSpecifierEnd = spec.named ? findNamedImportEnd(esmBlocks, spec.source) : undefined;
    if (lastSpecifierEnd !== undefined) {
        return tr.insertText(`, ${spec.name}`, lastSpecifierEnd);
    }

    const statement = importStatement(spec);
    const [firstBlock] = esmBlocks;
    if (firstBlock) {
        const contentEnd = firstBlock.pos + firstBlock.node.nodeSize - 1;
        return tr.insertText(`\n${statement}`, contentEnd);
    }
    const frontmatter = tr.doc.firstChild?.type === nodes.frontmatter ? tr.doc.firstChild : null;
    const esmBlock = nodes.raw_block.create({ kind: 'mdxjsEsm' }, schema.text(statement));
    return tr.insert(frontmatter?.nodeSize ?? 0, esmBlock);
};

interface EsmBlock {
    node: Node;
    pos: number;
}

const findEsmBlocks = (doc: Node) => {
    const blocks: EsmBlock[] = [];
    doc.forEach((node, pos) => {
        if (node.type === nodes.raw_block && node.attrs.kind === 'mdxjsEsm') {
            blocks.push({ node, pos });
        }
    });
    return blocks;
};

const importStatement = (spec: ImportSpec) => {
    const imported = spec.named ? `{ ${spec.name} }` : spec.name;
    return `import ${imported} from '${spec.source}';`;
};

/** the document position after the last name of `import { a, b } from 'source'` */
const findNamedImportEnd = (esmBlocks: EsmBlock[], source: string): number | undefined => {
    for (const { node, pos } of esmBlocks) {
        const declaration = importDeclarations(node.textContent).find(
            (declaration) => declaration.source.value === source && hasNamedSpecifiers(declaration)
        );
        const end = declaration?.specifiers.at(-1)?.range?.[1];
        if (end !== undefined) {
            // the offsets of estree are relative to the text of the block, its content starts at `pos + 1`
            return pos + 1 + end;
        }
    }
    return undefined;
};

const hasNamedSpecifiers = (declaration: ImportDeclaration) =>
    declaration.specifiers.length > 0 &&
    declaration.specifiers.every((specifier) => specifier.type === 'ImportSpecifier');

const importedNames = (declaration: ImportDeclaration) =>
    declaration.specifiers.map((specifier) => specifier.local.name);

const importDeclarations = (esmSource: string): ImportDeclaration[] => {
    try {
        return parseMdx(esmSource).children.flatMap((node) => {
            const statements = node.type === 'mdxjsEsm' ? (node.data?.estree?.body ?? []) : [];
            return statements.filter((statement) => statement.type === 'ImportDeclaration');
        });
    } catch {
        // the author is editing the block and it is not valid (yet): treat it as importing nothing
        return [];
    }
};
