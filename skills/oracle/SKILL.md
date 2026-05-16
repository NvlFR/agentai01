# Oracle

Status: guidance-only.
Source: `referensi/openclaw/skills/oracle`

## Use When

- Use when an operator needs read-only-first Oracle Database inspection, SQL diagnostics, or query review.
- Use when credentials are already available through environment variables, `.env.local`, wallet config, or a secure local profile.
- Do not use for schema changes, DML, account management, or production maintenance without explicit operator approval and rollback guidance.

## Requirements

- External client, depending on local setup:
  - `sqlplus`
  - `sqlcl`
  - Node `oracledb` scripts
  - Python `oracledb` scripts
- Credentials must come from secret storage or environment variables. Never hardcode them in commands, scripts, docs, or chat.
- Typical secret-bearing values:
  - `ORACLE_USER`
  - `ORACLE_PASSWORD`
  - `ORACLE_CONNECT_STRING`
  - wallet path and wallet password, if used
- Confirm the Oracle client and driver behavior from installed docs/source before relying on defaults.

## Workflow

1. Start read-only. Confirm target database, schema, and purpose.
2. Verify client availability without printing secrets:

```bash
sqlplus -V
sql -V
node -e "import('oracledb').then(() => console.log('oracledb available'))"
```

3. Connect using secret-safe local config. Avoid inline passwords in shell history.
4. Inspect metadata before data:

```sql
SELECT table_name FROM user_tables ORDER BY table_name;
SELECT column_name, data_type, nullable FROM user_tab_columns WHERE table_name = 'TABLE_NAME' ORDER BY column_id;
```

5. For data reads, use bounded queries:

```sql
SELECT * FROM table_name FETCH FIRST 20 ROWS ONLY;
```

6. For query debugging, prefer `EXPLAIN PLAN` or read-only views where available.
7. For any write, stop and ask for confirmation with:
   - exact SQL
   - target environment
   - expected row count or object impact
   - rollback or recovery plan
   - validation query

## Safety

- Never print connection strings that include passwords.
- Never echo `.env.local`, wallet files, key files, or connection profiles.
- Default to read-only sessions and bounded result sets.
- Redact customer data in summaries.
- Require explicit approval for `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `CREATE`, `ALTER`, `DROP`, `GRANT`, `REVOKE`, package execution, or scheduler jobs.
- Do not run production writes from an agent session unless the operator has clearly authorized that exact action.

## Validation

```bash
sqlplus -V
sql -V
```

Read-only smoke query, after the operator has configured credentials locally:

```sql
SELECT 1 AS ok FROM dual;
```

This skill is not executable by `SkillRegistry`; it documents safe database workflow and credential boundaries.
