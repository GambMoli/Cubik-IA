# Tasks

## 1. Root config

- [x] 1.1 Update `openspec/config.yaml` context: SRS name and IDs, users, RF-04 scope, RF-03/RF-14 exceptions, role visibility (Decision 1), RNF-01..RNF-09 targets plus accuracy and OCR (Decisions 3-4). Verify: `grep -n 'aggregated/anonymized\|uptime >= 99' openspec/config.yaml` returns nothing.
- [x] 1.2 Update root rules: proposal (IDs with MoSCoW, quality targets), specs (ID traceability, SRS metric in scenarios, RNF-02 category), design (RNF-09 backups, RNF-03 TLS), tasks (backup/restore verification), archive (RF/RNF traceability). Verify: PyYAML parses the file.

## 2. Component configs

- [x] 2.1 Update `backend/openspec/config.yaml` per Decisions 5-6. Verify: `grep -n -i 'exam-mode' backend/openspec/config.yaml` returns nothing; PyYAML parses the file.
- [x] 2.2 Update `frontend/openspec/config.yaml`: fix the RNF-01/RNF-02 labels, add RNF-08, RF-03/RF-14 confirmations, RNF-02-aware timeouts, RNF-07 coverage, remove exam-mode. Verify: `grep -n 'RNF-01)\|RNF-02)\|exam-mode' frontend/openspec/config.yaml` returns nothing; PyYAML parses the file.

## 3. Guide

- [x] 3.1 Align root `CLAUDE.md` scope, tutor constraint and visibility statements with the root config. Verify: `grep -n 'aggregated/anonymized' CLAUDE.md` returns nothing.

## 4. Integration checks

- [x] 4.1 Confirm only OpenSpec config, the root guide and this change changed. Verify: `git status --short`.
- [x] 4.2 Confirm `openspec context --json` resolves the root from `openspec/`, `backend/` and `frontend/`.
- [x] 4.3 Validate the change. Verify: `openspec validate align-openspec-config-with-requirements` passes.

## Workflow follow-up

- Archive the change after review.
- Add the SRS to `docs/` and cite its path in the root context (Open Question 1).
- Fix the SRS inconsistencies listed in design.md (Open Question 2) and update the root context if values change.
