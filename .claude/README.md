# Claude Code agent configuration

This folder configures Claude Code agents and project skills for the Cal Clone repo.

## Structure

```
.claude/
├── agents/          # Custom subagents (delegated specialists)
└── skills/          # Agent skills (SKILL.md playbooks)
```

Cursor-specific rules live in `.cursor/rules/`. Both tools share the same skill content.

## Agents

| Agent | File | Use for |
| ----- | ---- | ------- |
| Frontend designer | `agents/frontend-designer.md` | UI components, pages, styling, visual polish |
| Backend engineer | `agents/backend-engineer.md` | APIs, services, Prisma, integrations |

## Skills

| Skill | Source | Use for |
| ----- | ------ | ------- |
| `frontend-design` | [Anthropic / Skills Hub](https://www.skillshub.work/skill/frontend-design) | Distinctive, production-grade UI |
| `backend-principles` | [ECC / Skills Hub](https://www.skillshub.work/skill/ecc-skill-backend-patterns) | API design, services, database patterns |

Install path for Claude Code: `.claude/skills/<skill-name>/SKILL.md`

Invoke explicitly with `/frontend-design` or let Claude load skills when task descriptions match.
