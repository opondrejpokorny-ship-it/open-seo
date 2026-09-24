# OpenSEO Full MCP

Status: pilot, 2026-09-24

## Goal

Keep the existing OpenSEO fork as the product and extend its native `/mcp`
surface instead of building a second wrapper service.

Principles:

- Reuse OpenSEO services; do not duplicate business logic.
- Keep upstream tools and contracts intact.
- Prefer free/owned data before paid external research.
- Keep paid calls explicit, measurable, and bounded.
- Preserve easy upstream merges.

## Architecture

```text
AI client
   |
   v
OpenSEO /mcp
   |
   +-- OpenSEO project/services/database
   +-- Google Search Console / GA4
   +-- local/free sources
   +-- DataForSEO paid external data
```

Local development uses `AUTH_MODE=local_noauth` and must remain private or
loopback-only unless a separate authentication layer protects it.

## Capability matrix

| Area                 | App capability                                           | MCP status                                 |
| -------------------- | -------------------------------------------------------- | ------------------------------------------ |
| Identity/projects    | user, projects, project context                          | Covered                                    |
| Keywords             | research, metrics, saved keywords                        | Covered                                    |
| Domain research      | overview, ranked keywords, suggestions                   | Covered                                    |
| SERP                 | organic and local SERP research                          | Covered                                    |
| Backlinks            | overview and profile                                     | Covered                                    |
| Competitors          | SERP competitor discovery                                | Covered                                    |
| Rank tracking        | create/read/run/manage keywords                          | Covered                                    |
| Local SEO            | listings, profile, reviews, updates, grid, Q&A           | Covered                                    |
| Search Console       | performance, URL inspection                              | Covered                                    |
| GA4                  | organic, pages, events, acquisition, ecommerce, audience | Covered                                    |
| Search opportunities | joined GSC + GA4 opportunity scoring                     | Covered                                    |
| Site audit           | run/list/status/issues/pages/delete                      | Covered                                    |
| Reports              | reports and report templates                             | Covered                                    |
| AI Visibility        | brand lookup, citations, Share of Voice                  | Pilot: `get_ai_brand_visibility`           |
| AI Prompt Explorer   | multi-model responses and citations                      | Pilot: `explore_ai_prompt`                 |
| Lighthouse           | used by app/audit internals                              | Review whether separate raw MCP adds value |
| SAM                  | in-app agent orchestration                               | Not duplicated as an MCP tool              |
| Dashboard/activation | UI/internal workflow                                     | Not an external MCP capability target      |

The baseline MCP server registered 57 tools before this pilot. The two AI
Visibility tools bring the pilot registry to 59.

## Free-first policy

1. Use project data, GSC, and GA4 when they answer the question.
2. Reuse cached results before initiating paid research.
3. Prefer a local/free crawler for routine technical checks where practical.
4. Use DataForSEO for external keyword, SERP, backlink, competitor, and local data.
5. Treat AI/LLM visibility calls and large batches as expensive operations.

## Pilot verification

Required before merging:

- dependency install succeeds;
- TypeScript check passes;
- MCP output-schema contract tests pass;
- local database migrations succeed;
- local app responds healthy;
- MCP initialize/tools-list succeeds;
- `whoami` succeeds;
- `list_projects` succeeds;
- paid DataForSEO calls are not required for the protocol smoke test.

A live paid SEO read is deferred until a DataForSEO credential is configured.

## Upstream compatibility

Custom MCP additions should stay concentrated in `src/server/mcp/tools` where
possible. Shared access rules may live with their owning feature so UI and MCP
cannot drift. Avoid forking provider/client logic unless a provider abstraction
is deliberately introduced later.

## Pilot progress — 2026-09-24

Completed:

- native Windows local development is running with `AUTH_MODE=local_noauth`;
- all 48 local D1 migrations applied successfully;
- `/api/health` reports the app and database healthy;
- `/mcp` publishes 59 tools (57 upstream + 2 AI Visibility tools);
- `whoami`, `list_projects`, `create_project`, and `get_project_context`
  succeeded in live local JSON-RPC smoke tests;
- missing DataForSEO configuration is now reported explicitly before AI
  Visibility provider calls;
- targeted MCP/access tests pass (8/8);
- Prettier, Knip, root TypeScript, BadSEO TypeScript, type-aware Oxlint, and
  plugin skill-sync checks pass.

The full Vitest suite is not fully portable to this Windows host: baseline tests
currently fail where they require `bash`, rely on OS locale sorting, hit a
Windows temp-directory cleanup `EPERM`, or time out in an unrelated OAuth
test. None of those failures touch the pilot files. A Linux CI run remains the
authoritative full-suite gate.

Pending:

- configure a DataForSEO credential and run one bounded paid happy-path test;
- optionally connect GSC/GA4 for a real project;
- decide whether a separate raw Lighthouse MCP tool adds useful capability;
- evaluate a local/free crawler integration as the next free-first extension.
