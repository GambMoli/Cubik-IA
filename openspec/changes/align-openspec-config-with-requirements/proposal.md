# Proposal

## Why

A review of the three `config.yaml` files against the SRS "Requerimientos funcionales y no funcionales - Cubik IA" (RF-01..RF-14, RNF-01..RNF-09) found rules that would make future changes miss or contradict Must requirements:

- Root context: "docentes only see aggregated/anonymized analytics" forbids RF-08 (Must, per-student analytics for a docente) and RF-10 (export of those metrics).
- Root context: "never a direct homework solver" with no exception conflicts with RF-03 (Must, conditional release of the full solution).
- Subject scope omits the algebra foundations of RF-04 (Must); the backend treats off-syllabus queries as a failure path.
- `frontend/openspec/config.yaml` labels look & feel as RNF-01 and LaTeX rendering as RNF-02; in the SRS those IDs are availability and response time.
- The root proposal rule cites uptime >= 99% (Anteproyecto); RNF-01 sets 99.5% in the academic-hours window.
- RNF-02..RNF-09 targets (P95 per category, TLS 1.2+, JWT <= 1 h, 30 requests/s, RNF-06 grading formula, coverage, browsers and widths, RPO/RTO) appear in no rule, so specs cannot carry them.
- "Exam-mode" 403 rules trace to no requirement in the SRS or the Anteproyecto.

## What Changes

- Root `openspec/config.yaml`: names the SRS and its IDs; lists users and role visibility (student own data, docente per-student data for their own courses, aggregated unit analytics); adds RF-04 to scope; adds the RF-03 and RF-14 confirmation exceptions; lists the RNF-01..RNF-09 targets plus accuracy >= 85% and OCR >= 75%; rules require ID traceability, SRS metrics in scenarios, an RNF-02 category per operation, and backup/restore (RNF-09) and TLS (RNF-03) design and tasks when relevant.
- `backend/openspec/config.yaml`: backend-enforced constraints (RF-03 gate, RNF-06 deterministic grading with algorithm version, RF-13/RF-14 upload limits and confirmation, RF-04/RF-05 counts, RF-11 logging, authorization, JWT <= 1 h); extra failure paths; Locust tasks for the RNF-04 profile; "exam-mode" removed.
- `frontend/openspec/config.yaml`: wrong RNF IDs fixed; RNF-08 browsers and 360-1920 px; RF-03/RF-14 confirmations; UI timeouts no shorter than the RNF-02 target; RNF-07 coverage; "exam-mode" removed.
- Root `CLAUDE.md`: three statements aligned with the root config (scope, RF-03, visibility).

## Capabilities

### New Capabilities
None. OpenSpec configuration and guide only; `.openspec.yaml` sets `skip_specs: true`.

### Modified Capabilities
None.

## Impact

- **Components touched:** OpenSpec config of root, backend and frontend; root `CLAUDE.md`. No code, compose, Dockerfile or env change.
- **Traceability:** RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-10, RF-11, RF-12, RF-13, RF-14; RNF-01..RNF-09.
- **Out of scope:** adding the SRS file to `docs/`, and fixing the inconsistencies inside the SRS listed in design.md (Open Questions).
