# Obsidian

Status: guidance-only.
Source: `referensi/openclaw/skills/obsidian`

## Use When

- Use when searching, reading, creating, or updating notes in an Obsidian vault.
- Use when the vault is available as normal Markdown files on disk or through an installed `obsidian-cli`.
- Do not use when the operator has not identified the vault path or vault name.

## Requirements

- Obsidian vault: a directory containing Markdown notes.
- Optional external binary: `obsidian-cli`.
- Linux-friendly fallback: use filesystem tools such as `rg`, `find`, and normal Markdown edits when the vault path is known.
- The `.obsidian/` directory contains app/plugin settings; avoid automated edits there unless explicitly requested.

## Workflow

1. Confirm the vault target.
   - Preferred: operator-provided path.
   - Optional CLI: `obsidian-cli print-default --path-only`.
2. Search before writing:

```bash
rg -n "query" path/to/vault --glob '*.md'
```

3. Read the smallest relevant notes.
4. For direct Markdown edits, modify the note file and preserve existing frontmatter, links, and heading style.
5. For CLI-assisted operations, use:

```bash
obsidian-cli search "query"
obsidian-cli search-content "query"
obsidian-cli create "Folder/New note" --content "CONTENT"
obsidian-cli move "Old note" "Folder/New note"
```

6. Verify by re-reading the changed file or re-running the search.

## Safety

- Treat vaults as private knowledge stores. Do not paste large private note contents into final answers.
- Do not guess vault paths.
- Avoid touching `.obsidian/`, attachment folders, or canvases unless the task specifically requires it.
- Confirm before deleting, moving, or bulk rewriting notes.
- Preserve wiki links, Markdown links, tags, and aliases when editing.
- Do not commit personal vault content into this repo.

## Validation

```bash
rg -n "query" path/to/vault --glob '*.md'
obsidian-cli --help
obsidian-cli print-default --path-only
```

This skill is not executable by `SkillRegistry`; it is an operator workflow for external vaults.
