# Project Guidelines

## Setup Requirements
- All code must be pushed to a **public GitHub repository** (not GitLab)
- The project must remain public throughout development

## Documentation to Generate
Before writing any code, generate the following documents:
1. **Implementation Guide** – step-by-step build plan
2. **HLD (High-Level Design)** – system architecture overview
3. **LLD (Low-Level Design)** – component-level design details
4. **Schema Design** – database/data model definitions

## Development Workflow
For every feature or module:
- Write **User Stories** before implementation
- Maintain **API Documentation** alongside code
- Log **Architecture Decision Records (ADRs)** for key choices
- Produce a **Deployment Guide** after each major milestone

## Verification Checklist (run before every PR)
- [ ] Code aligns with HLD
- [ ] Code aligns with LLD
- [ ] Schema matches implementation
- [ ] Guardrails are in place (input validation, rate limiting, auth)
- [ ] Cyberattack vectors reviewed (OWASP Top 10 minimum)
- [ ] CI/CD pipeline passes

## CI/CD Requirements
- GitHub Actions pipeline must cover: lint → test → build → deploy
- No merge to main without pipeline passing

## Deliverables
- GitHub repo link (public)
- Deployed app link (with credentials if auth-protected)