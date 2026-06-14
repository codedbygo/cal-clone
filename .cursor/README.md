# Cursor agent configuration

This folder configures Cursor agents and project skills for the Cal Clone repo.

## Structure

```
.cursor/
├── agents/          # Custom subagents (delegated specialists)
├── skills/          # Agent skills (SKILL.md playbooks)
└── rules/           # Cursor rules (.mdc)
```

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

Skills are loaded automatically when tasks match their `description`, or reference them explicitly in prompts.
