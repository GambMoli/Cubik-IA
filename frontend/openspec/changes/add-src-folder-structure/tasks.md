# Tasks

## 1. Folder Structure

- [x] 1.1 Create `assets`, `components`, `hooks`, `icon`, `layouts`, `modules`, `routes`, `utils` under `frontend/src` and verify `ls frontend/src` lists all eight
- [x] 1.2 Add an empty `.gitkeep` to each of the eight folders and verify `git status -uall --short frontend/src` lists a `.gitkeep` for every folder

## 2. Verification

- [x] 2.1 Run `pnpm run build` and `pnpm run lint` from `frontend/` and verify both complete without errors
- [x] 2.2 Run `openspec validate add-src-folder-structure --strict` and verify it passes
