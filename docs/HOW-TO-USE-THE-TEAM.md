# Your AI app team: setup

## 1. Install
In your app's project folder:

```
.claude/
  agents/
    product-manager.md
    designer.md
    lead-developer.md
    qa-tester.md
docs/
  SPEC.md  DESIGN.md  TECH.md  DECISIONS.md  BUGS.md  TEST-REPORT.md
```

Create the `docs/` files empty. They're the team's shared "Slack channel".

## 2. Run a sprint
Open Claude Code in the project and say something like:

> Run a sprint for [feature]. Use product-manager to write the spec, then designer, then lead-developer, then qa-tester. Loop lead-developer and qa-tester until there are no blockers. Pause and show me the spec and design before any code is written.

## 3. Make them argue (the useful part)
- Ask for a "design review meeting": have each agent comment on the others' docs.
- Ask Maya to make the final call on scope disagreements and log it in DECISIONS.md.

## Tips
- Keep yourself as the checkpoint after spec and after design. That's where bad ideas are cheapest to kill.
- Edit the personalities freely. Stronger opinions mean better debates.
