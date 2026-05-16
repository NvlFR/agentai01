# Notion

Status: guidance-only. This skill documents safe Notion API workflows for the AI Company Runtime Platform; it is not a runtime `SkillRegistry` executable.
Source: `referensi/openclaw/skills/notion`

## Use When

- The operator asks to find, read, create, or update Notion pages, blocks, databases, or data sources.
- A product, project-management, sales, or support workflow needs structured Notion documentation.
- You have explicit page, database, or data source IDs and know the integration has access.

## Requirements

- Notion integration created by the operator.
- Target pages or databases shared with that integration.
- `NOTION_API_KEY` from environment or `.env.local`; never commit or print it.
- `curl` and optionally `jq`.
- Notion API version header. Use `NOTION_VERSION=2025-09-03` when working with the current data source API.

Setup pattern:

```bash
export NOTION_VERSION=2025-09-03
test -n "$NOTION_API_KEY"
```

The 2025-09-03 API introduces first-class data source APIs. Databases are containers; data sources hold the rows and schema used for data-source queries.

## Workflow

1. Confirm the workspace, page/database/data-source target, and desired outcome.
2. Run read-only discovery first.
3. For writes, identify the exact parent and required property schema.
4. Draft the payload and ask the operator to confirm the target and content.
5. Execute the request.
6. Verify with a read-only GET or query.

### Read-Only Discovery

Search pages and data sources:

```bash
curl -sS -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" \
  -H "Content-Type: application/json" \
  --data '{"query":"project notes","page_size":10}' | jq '.results[] | {object, id, title: .title}'
```

Get a page:

```bash
curl -sS "https://api.notion.com/v1/pages/PAGE_ID" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" | jq '{id, parent, properties}'
```

Read page blocks:

```bash
curl -sS "https://api.notion.com/v1/blocks/PAGE_ID/children?page_size=100" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" | jq '.results[] | {id, type}'
```

Retrieve a data source:

```bash
curl -sS "https://api.notion.com/v1/data_sources/DATA_SOURCE_ID" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" | jq '{id, title, properties}'
```

Query a data source:

```bash
curl -sS -X POST "https://api.notion.com/v1/data_sources/DATA_SOURCE_ID/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" \
  -H "Content-Type: application/json" \
  --data '{"page_size":10}' | jq '.results[] | {id, properties}'
```

### Mutating Actions

Only run these after explicit operator confirmation. Use exact IDs and schema-compatible property values.

Create a page under a page:

```bash
curl -sS -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" \
  -H "Content-Type: application/json" \
  --data '{"parent":{"page_id":"PAGE_ID"},"properties":{"title":{"title":[{"text":{"content":"Operator-approved title"}}]}}}'
```

Create a page in a data source parent:

```bash
curl -sS -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" \
  -H "Content-Type: application/json" \
  --data '{"parent":{"type":"data_source_id","data_source_id":"DATA_SOURCE_ID"},"properties":{"Name":{"title":[{"text":{"content":"Operator-approved item"}}]},"Status":{"select":{"name":"Todo"}}}}'
```

Update page properties:

```bash
curl -sS -X PATCH "https://api.notion.com/v1/pages/PAGE_ID" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" \
  -H "Content-Type: application/json" \
  --data '{"properties":{"Status":{"select":{"name":"Done"}}}}'
```

Append blocks:

```bash
curl -sS -X PATCH "https://api.notion.com/v1/blocks/PAGE_ID/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" \
  -H "Content-Type: application/json" \
  --data '{"children":[{"object":"block","type":"paragraph","paragraph":{"rich_text":[{"text":{"content":"Operator-approved paragraph"}}]}}]}'
```

## Property Types

- Title: `{"title":[{"text":{"content":"..."}}]}`
- Rich text: `{"rich_text":[{"text":{"content":"..."}}]}`
- Select: `{"select":{"name":"Option"}}`
- Multi-select: `{"multi_select":[{"name":"A"},{"name":"B"}]}`
- Date: `{"date":{"start":"2026-05-16"}}`
- Checkbox: `{"checkbox":true}`
- Number: `{"number":42}`
- URL: `{"url":"https://example.com"}`
- Email: `{"email":"person@example.com"}`
- Relation: `{"relation":[{"id":"PAGE_ID"}]}`

## Safety

- Require explicit target page, database, or data source ID before writes.
- Confirm final page titles, property changes, and block text before writes.
- Do not assume legacy database endpoints work for current data-source workflows.
- Do not create or update schemas unless the operator specifically requests that.
- Redact page content that is outside the requested scope.
- Respect Notion rate limits; handle `429` responses using `Retry-After`.
- Append blocks in bounded batches; Notion payload size and child-count limits apply.

## Validation

```bash
test -n "$NOTION_API_KEY"
test -n "$NOTION_VERSION"
curl -sS -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: $NOTION_VERSION" \
  -H "Content-Type: application/json" \
  --data '{"page_size":1}' | jq '{object, has_more}'
```
