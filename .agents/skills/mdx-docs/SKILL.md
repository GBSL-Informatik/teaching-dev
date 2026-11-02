---
name: mdx-docs
description: Write or edit repository Markdown and MDX documentation using Teaching Dev conventions, components, and remark syntax. Read before changing .md or .mdx documentation.
---

# MDX Documentation

Apply these rules to `.md` and `.mdx` documentation, not source code. Keep edits focused on the requested feature or page.

## Language and content

- Write for computer science teachers at upper secondary schools (Gymnasium). Assume programming knowledge, but explain Teaching Dev concepts and setup requirements. Use classroom-relevant examples and focus on what teachers need to create and use teaching materials.
- Write framework documentation in Swiss Standard German: use ss instead of ß and proper umlauts (ä, ö, ü). Comments in embedded code examples may also be German. Preserve identifiers, file paths, commands, and quoted output.
- Lead usage documentation with a minimal working example. Explain prerequisites, surprising behaviour, constraints, and consequences the example does not reveal. Do not narrate each line or repeat API definitions in surrounding prose.
- Use headings for topics, ordered lists for sequences, and unordered lists for parallel items. Keep workflows and narrative explanations in prose. Reserve tables for comparisons across several dimensions.

## Location and identity

- Keep package usage and API references in a root `README.mdx` or a `docs/` directory with `README.mdx` or `index.mdx` and optional subpages. Keep related assets alongside the documentation, following the package's existing layout.
- Edit package sources under `packages/`, not synchronized copies under `tdev-website/docs/packages/`. The synchronization logic is in [updateSync/packageDocsSync](../../../updateSync/packageDocsSync).
- Package docs are the reference. Teacher-facing pages under `tdev-website/docs/` demonstrate classroom use and link to the reference. Add or update a gallery page when relevant to the requested feature; keep overlapping examples consistent without duplicating the full API reference.
- Preserve existing frontmatter, including `page_id`, when editing or moving pages. Preserve persisted component IDs in existing examples.
- Whenever a component needs a new `id` attribute or an MDX page needs a new `page_id`, generate a fresh, random, valid UUIDv4 using a UUID generator, such as `crypto.randomUUID()` or Python's `uuid.uuid4()`. Do not invent UUIDs, copy them from other examples, or reuse an existing ID for a new component or page.

## API definitions

Use definition lists for attributes, props, options, parameters, API functions, and terminology. Include types, defaults, and constraints when useful. Put each term on its own line, followed by one or more `: ` definitions:

```md
`option`
: Description.
: Standard: `false`.
`otherOption`
: Description of the next option.
```

For code blocks, lists, or other block content within a definition, use `:::dd`. See the [definition-list gallery](../../../tdev-website/docs/gallery/markdown/remark-deflist/index.mdx) for examples.

## Examples and instructions

Use `CodeShowcase` when readers benefit from seeing source alongside its rendered or interactive result. Use ordinary fenced blocks for commands, configuration, and standalone snippets. Keep existing runnable code-fence metadata when editing live examples.

Import components explicitly. For Markdown demonstrations, set `lang="md"`. Use `imports` to include the imports readers need in the displayed source:

```mdx
import CodeShowcase from '@tdev-components/CodeShowcase';
import Steps from '@tdev-components/Steps';

<CodeShowcase lang="md" imports={[`import Steps from '@tdev-components/Steps';`]}>
<Steps>

1. Öffne die Einstellungen.
2. Speichere die Änderungen.

</Steps>
</CodeShowcase>
```

Wrap ordered lists describing user actions in `Steps`; use ordinary lists for other enumerations. See the [Steps gallery](../../../tdev-website/docs/gallery/display/steps/index.mdx).

## Repository syntax

Use the relevant gallery page for detailed syntax rather than inventing JSX or copying plugin setup into usage guides:

- [Cards and flex](../../../tdev-website/docs/gallery/markdown/remark-flex-cards/index.mdx): `:::cards` or `:::flex`, with `::br` between items. When nesting directives, use longer outer fences, such as `::::flex` around `:::cards`.
- [Details](../../../tdev-website/docs/gallery/markdown/remark-details/index.mdx): use a container with a summary:

  ```md
  :::details[Weitere Informationen]
  Optionaler Inhalt.
  :::
  ```

- [Admonitions](../../../tdev-website/docs/gallery/markdown/admonitions/index.mdx): use notes, tips, and warnings for information that needs attention, not routine prose.
- [Keyboard shortcuts](../../../tdev-website/docs/gallery/markdown/remark-kbd/index.mdx): `[[Ctrl]] + [[C]]`.
- [Inline icons](../../../tdev-website/docs/gallery/markdown/remark-mdi/index.mdx): `:mdi[skateboarding]`.
- [Boxed emphasis](../../../tdev-website/docs/gallery/markdown/remark-strong/index.mdx): `__path/to/file__` highlights a path using the repository's boxed style. Use it when highlighting a file or directory helps; use `**text**` for ordinary bold and backticks for identifiers and commands.
- [Images](../../../tdev-website/docs/gallery/markdown/remark-image/index.mdx): alt text becomes the caption. Consult the gallery for size options, attribution JSON, and inline images.
- Diagrams and formulas: consult [Mermaid](../../../tdev-website/docs/gallery/markdown/mermaid/index.mdx), [Graphviz](../../../tdev-website/docs/gallery/markdown/remark-graphviz/index.mdx), or [math](../../../tdev-website/docs/gallery/markdown/remark-math/index.mdx) when they clarify the content.

## Validation

- Check documented APIs, defaults, and constraints against the implementation. Verify local links and imports, including relative paths after moving a page.
- After structural MDX changes, compile the affected pages with the relevant remark plugins. Preview changes involving layout or interaction.
- Markdown and MDX are excluded from repository-wide Prettier checks; `format:check` does not validate them. Review their formatting by hand.

