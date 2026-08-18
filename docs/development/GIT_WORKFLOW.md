# LAKSHYA — Git & Branching Workflow Specification

## 1. Primary Repository & Identity Rules

* **Repository**: `HB2810/Lakshya`
* **Primary Account**: `HB2810` (`152075694+HB2810@users.noreply.github.com`)
* **Default Branch**: `main`

All commits created by automated agents and developers MUST use the primary identity:
```bash
git config user.name "HB2810"
git config user.email "152075694+HB2810@users.noreply.github.com"
```

---

## 2. Branch Model

```text
main (Stable baseline)
│
├── feature/phase-2-foundation   (Backend identity, access, and audit engine)
│
└── feature/frontend-foundation  (Frontend Next.js application & UI components)
```

1. **`main`**: Protected production baseline. Direct commits to `main` are prohibited.
2. **`feature/*`**: Isolated topic branches for backend, frontend, infrastructure, and documentation work.

---

## 3. Hygiene & Anti-Contamination Rules

1. **Never Track Credentials**: `.env` and secret files MUST remain un-tracked.
2. **Never Track Generated Artifacts**: `node_modules/`, `.next/`, `.venv/`, `__pycache__/`, `build/`, and `*.egg-info/` MUST remain un-tracked.
3. **Pre-Commit Verification**: Run `git status` and `git diff --cached` before every commit to ensure no build artifacts or secrets enter Git history.
