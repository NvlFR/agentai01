# xurl

Status: guidance-only.
Source: `referensi/openclaw/skills/xurl`

## Use When

- Use when an operator or marketing agent needs X/Twitter operations through the `xurl` CLI.
- Use for post, reply, quote, search, direct message, media upload, profile lookup, timeline, mentions, or raw X API v2 calls.
- Do not use when the operator has not provided an explicit account/app target for externally visible actions.

## Requirements

- External binary: `xurl`.
- Install options:
  - `npm install -g @xdevplatform/xurl`
  - `go install github.com/xdevplatform/xurl@latest`
  - Linux shell installer from the upstream project, if the operator accepts that path.
- Authentication must already be configured by the operator outside agent context.
- Credentials are stored by `xurl`; never read, print, summarize, or attach `~/.xurl`.
- Validate availability with:

```bash
xurl --help
xurl auth status
```

## Workflow

1. Confirm the intended app/account with `xurl auth status`, `xurl whoami`, or a read-only raw call such as `xurl /2/users/me`.
2. For read tasks, run the narrowest command:
   - `xurl read POST_ID_OR_URL`
   - `xurl search "QUERY" -n 10`
   - `xurl user @handle`
   - `xurl mentions -n 20`
   - `xurl timeline -n 20`
   - `xurl dms -n 10`
3. For write tasks, draft the exact target, account, action, and final text/media ids. Ask for confirmation before sending.
4. Execute the confirmed command:
   - Post: `xurl post "TEXT"`
   - Reply: `xurl reply POST_ID_OR_URL "TEXT"`
   - Quote: `xurl quote POST_ID_OR_URL "TEXT"`
   - DM: `xurl dm @handle "TEXT"`
   - Like/repost/bookmark: `xurl like POST_ID`, `xurl repost POST_ID`, `xurl bookmark POST_ID`
5. For media, upload first, wait for processing if needed, then attach the returned media id:

```bash
xurl media upload path/to/file.jpg
xurl media status --wait MEDIA_ID
xurl post "TEXT" --media-id MEDIA_ID
```

6. For multi-account work, select explicitly:

```bash
xurl auth default APP_NAME USERNAME
xurl --app APP_NAME --username USERNAME /2/users/me
```

7. Verify the result with a read command such as `xurl read POST_ID_OR_URL`, `xurl mentions -n 5`, or `xurl dms -n 5`.

## Safety

- Never ask the user to paste tokens, client secrets, consumer keys, or access tokens into chat.
- Never use secret-bearing flags in agent commands: `--bearer-token`, `--consumer-key`, `--consumer-secret`, `--access-token`, `--token-secret`, `--client-id`, `--client-secret`.
- Never use `--verbose` or `-v`; output may include sensitive headers.
- Treat public posts, replies, quotes, likes, reposts, follows, blocks, mutes, and DMs as externally visible writes.
- Require explicit target id or handle before any write.
- Check rate-limit errors and scopes before retrying. Do not loop retries on 429 or 403.
- Do not attach private media unless the operator explicitly confirmed the file path and recipient/audience.

## Validation

```bash
xurl --help
xurl auth status
xurl /2/users/me
```

This skill is not executable by `SkillRegistry`; do not run `bun skills/workshop.mjs validate skills/xurl` unless it later gains `skill.json`, `index.mjs`, and tests.
