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

## Detailed gap plan

The server-function inventory was compared with the MCP registry after the
59-tool pilot.

### P1 — project lifecycle

Add explicit tools for:

- update project;
- list archived projects;
- archive project;
- restore project;
- set/change the project website.

These are local/database operations and use no DataForSEO credits. Archive and
restore must preserve the app's organization permission checks and advertise
accurate MCP destructive annotations.

### P2 — Google integration management

The reporting surfaces are already covered, but connection management is not.
Add tools for:

- read GSC connection status;
- list accessible GSC properties;
- select a GSC property;
- disconnect GSC;
- start the self-hosted GSC OAuth link flow;
- read GA4 connection status;
- list accessible GA4 properties;
- select a GA4 property;
- disconnect GA4;
- start the self-hosted GA4 OAuth link flow.

OAuth-start tools should return an action URL rather than attempt to automate
the user's Google consent screen.

### P3 — rank tracking depth

The current MCP covers configs, latest results, keyword add/remove, cost
estimate, and manual run. Review/add:

- update tracker configuration;
- keyword history;
- tracker trend;
- position matrix;
- refresh tracked-keyword metrics.

### P4 — saved keyword maintenance

Add the useful non-export operations that are only in the app today:

- update keyword tags;
- update/rename/delete tag definitions;
- refresh saved keyword metrics.

CSV/export-only helpers do not need dedicated MCP tools when the same structured
data is already available.

### P5 — Lighthouse audit detail

Expose the stored Lighthouse issue detail for an existing site-audit result.
Prefer a structured read tool over an export-file wrapper.

### P6 — report sharing

The MCP can create/read/delete reports, but the app can also share and unshare
them. Add explicit share/unshare tools with capability-token handling kept
inside the service; do not expose stored share tokens in ordinary report reads.

### Admin/agent-control layer

Account/team/billing, onboarding, dashboard telemetry/actions, workspace merge,
and SAM session management are not ordinary SEO research capabilities. If the
goal becomes literally every app action, expose these in a separately documented
admin/agent-control group with stricter permissions and destructive annotations
rather than mixing them into routine SEO tools.
