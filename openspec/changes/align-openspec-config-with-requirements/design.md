# Design

## Context

See proposal.md - Why. The SRS is not in the repository yet; its content was reviewed from the team's PDF "Requerimientos funcionales y no funcionales - Cubik IA" (23 pages). The Anteproyecto (`docs/Anteproyecto Trabajo de Grado.pdf`) is the source of the >= 85% accuracy criterion, the pilot size (30 students, 3 docentes) and the Cálculo I, II and V scope.

## Goals / Non-Goals

**Goals:**
- No config rule contradicts a Must requirement of the SRS.
- Every quantitative target of RNF-01..RNF-09 is stated once, in the root config, so specs and designs can cite it by ID.
- Component configs hold only the constraints their component enforces, and point to the root for the targets.

**Non-Goals:**
- Writing specs for any RF (that is the job of the feature changes).
- Correcting the SRS itself (see Open Questions).
- Changing `backend/CLAUDE.md` or `frontend/CLAUDE.md`: nothing in them contradicts the new rules (backend coverage gate >= 85% already exceeds RNF-07's 70%).

## Decisions

### 1. Docente visibility: identified per course, not only aggregated
RF-08 asks for metrics of one student over a date range; RF-10 exports them. Rule: a docente sees identified per-student data only for students of a course where the LTI launch gives them a teaching role; RF-09 (by unit) stays aggregated. Identifiers stay pseudonymized at rest; names are resolved from Moodle for that course at request time (e.g., LTI NRPS) and not stored.
- Alternative: keep "aggregated/anonymized only". Rejected: makes RF-08 and RF-10 impossible.
- Alternative: store names and emails in Cubik-IA. Rejected: Ley 1581 minimization; Moodle already holds them.

### 2. Tutor constraint keeps RF-03 and RF-14 as the only exceptions
The full solution is shown only after a recorded attempt and an explicit confirmation (RF-03, 0% automatic releases). OCR text is evaluated only after explicit confirmation (RF-14).
- Alternative: leave the absolute "never a homework solver". Rejected: an agent would refuse RF-03.

### 3. Quality targets live once, in the root context
Each RNF target is written in the root context with its ID; component configs reference IDs and add only what they enforce. Specs must reuse the SRS number.
- Alternative: copy targets into each component config. Rejected: three places to keep in sync.

### 4. Values chosen where the SRS is internally inconsistent
- RNF-01: 99.5% of the academic-hours window, expressed as "unplanned downtime <= 0.5% of covered hours". The SRS scenario says 3.65 h/month, which is 0.5% of a 24x7 month (730 h); the 06:00-23:00 window is about 517 h/month (about 2.6 h). The rule avoids the absolute number until the team fixes it.
- RNF-02: the per-category P95 targets are taken from the SRS summary table and the LLM complexity table (27/28/30 s). The first streamed fragment is cited as "RNF-02's" without a number: the scenario says <= 5 s P95, while the SRS estimate (section 7) is about 26 s.
- RNF-07: deployment <= 15 min (the Gherkin scenario, which is the testable one); the "Meta" row says 20 min.

### 5. "Exam-mode" removed
Neither the SRS nor the Anteproyecto defines an exam mode. RF-07 (mock exams) does not require locking the tutor. Removed from the backend failure-path list and the frontend proposal/spec rules. If a survey or interview record supports it, a later change adds it back with that citation.

### 6. Backend constraints listed in its context
RF-03 gate, RNF-06 formula and algorithm version, RF-13 limits (PNG/JPG, 10 MB), RF-14 confirmation, RF-04/RF-05 exercise counts, RF-11 logging, authorization (RF-08, RF-11) and JWT <= 1 h (RNF-03). These are the rules a backend spec could otherwise miss. The model name for OCR stays in settings (the SRS names Gemini 3.5 Flash; `backend/CLAUDE.md` already makes Gemini the initial provider).

## Rule applicability (root `config.yaml` design rules)
- Mermaid sequence diagram: not applicable, no runtime interaction.
- OpenAPI contract changes: none.
- Infra impact: none.

## Risks / Trade-offs
- [Targets are copied from a document not yet in the repo] -> Open question 1; once the SRS is added, the context should cite its path.
- [Inconsistent SRS values may be fixed differently by the team] -> Decision 4 lists every value chosen; update the root context when the SRS changes.
- [Longer root context] -> 4.6 KB, well under OpenSpec's 50 KB limit.

## Open Questions
1. Add the SRS to `docs/` (preferably also as Markdown so sections can be cited)?
2. Fix in the SRS: RNF-01 monthly downtime (3.65 h vs about 2.6 h); RNF-02 first fragment (<= 5 s vs about 26 s), "300 ms x 5" for analytics (factor is x 8), "850 ms x 2" for exports (calculation is 900 ms x 4), and "Consistencia de calificación: RNF-07" (should be RNF-06); RF-11 precondition and postcondition copied from RF-10 and its circular dependency with RF-08/RF-09; RF-12 actor missing Docente; RNF-07 20 vs 15 min; RNF-09 preconditions and relations swapped; RF-09 scenario without its main metric.
3. RF-02, RF-04 and RF-05 have no RNF-02 category (exercise generation). Which target applies?
