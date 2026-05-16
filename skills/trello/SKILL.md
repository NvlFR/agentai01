# Trello

Status: guidance-only. This skill documents safe Trello REST API workflows for the AI Company Runtime Platform; it is not a runtime `SkillRegistry` executable.
Source: `referensi/openclaw/skills/trello`

## Use When

- The operator asks to inspect or manage Trello boards, lists, cards, comments, labels, or archived state.
- A project-management workflow needs Trello card movement or status reporting.
- You have explicit board, list, or card IDs.

## Requirements

- Trello API key and token created by the operator.
- Credentials from environment or local secret storage only:
  - `TRELLO_API_KEY`
  - `TRELLO_TOKEN`
- `curl` and `jq`.

Do not commit, print, or paste the key/token. Trello credentials are often passed as query parameters, so avoid shell tracing and do not share raw command logs.

## Workflow

1. Confirm the Trello workspace/board intent.
2. Discover boards, lists, and cards with read-only requests.
3. For writes, restate the exact board/list/card target and requested change.
4. Ask for explicit confirmation before create, move, comment, rename, label, archive, or delete-like actions.
5. Execute the API call.
6. Verify with a read-only follow-up.

### Read-Only Discovery

List boards:

```bash
curl -sS --get "https://api.trello.com/1/members/me/boards" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "fields=name,id,closed,url" | jq '.[] | {id, name, closed, url}'
```

List lists in a board:

```bash
curl -sS --get "https://api.trello.com/1/boards/BOARD_ID/lists" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "fields=name,id,closed" | jq '.[] | {id, name, closed}'
```

List cards in a list:

```bash
curl -sS --get "https://api.trello.com/1/lists/LIST_ID/cards" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "fields=name,id,desc,idList,closed,url" | jq '.[] | {id, name, idList, closed, url}'
```

Get a card:

```bash
curl -sS --get "https://api.trello.com/1/cards/CARD_ID" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "fields=name,desc,idList,closed,url,dateLastActivity" | jq '{id, name, idList, closed, url}'
```

### Mutating Actions

Only run these after explicit operator confirmation. Use exact board/list/card IDs.

Create a card:

```bash
curl -sS -X POST "https://api.trello.com/1/cards" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "idList=LIST_ID" \
  --data-urlencode "name=Operator-approved card title" \
  --data-urlencode "desc=Operator-approved description"
```

Move a card:

```bash
curl -sS -X PUT "https://api.trello.com/1/cards/CARD_ID" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "idList=DESTINATION_LIST_ID"
```

Add a comment:

```bash
curl -sS -X POST "https://api.trello.com/1/cards/CARD_ID/actions/comments" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "text=Operator-approved comment"
```

Archive a card:

```bash
curl -sS -X PUT "https://api.trello.com/1/cards/CARD_ID" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "closed=true"
```

## Safety

- Require explicit board, list, and card IDs before writes.
- Confirm all create, move, comment, archive, and delete-like actions.
- Never expose `TRELLO_API_KEY` or `TRELLO_TOKEN` in logs, screenshots, or summaries.
- Avoid `set -x` and avoid posting full request URLs because query strings contain credentials.
- Respect Trello rate limits: 300 requests per 10 seconds per API key, 100 requests per 10 seconds per token, and stricter `/1/members` limits.
- Handle `429` responses by backing off instead of retrying in a loop.

## Validation

```bash
test -n "$TRELLO_API_KEY"
test -n "$TRELLO_TOKEN"
curl -sS --get "https://api.trello.com/1/members/me/boards" \
  --data-urlencode "key=$TRELLO_API_KEY" \
  --data-urlencode "token=$TRELLO_TOKEN" \
  --data-urlencode "fields=name,id" | jq '.[0] // {}'
```
