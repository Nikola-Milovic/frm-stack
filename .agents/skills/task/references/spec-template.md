# Task Spec Template

Use this template when creating task specifications. Omit sections not relevant to the task type.

---

# Task: <Title>

**Status:** Backlog | In Progress | Completed
**Created:** <date>
**Plan:** <link to plan if applicable>
**Type:** Feature | Bug | Refactor | Docs | Chore

## Summary

One paragraph describing the task and why it exists. What problem does this solve? What value does it deliver?

## User Journey

- **Entry point**: How does the user arrive at this feature?
- **Happy path**: Step-by-step flow when everything works
- **Exit criteria**: How does the user know they're done?

## UX Guidelines

- What the user should see (and should not see)
- Copy tone, language considerations
- Confirmation behaviors (optimistic UI, loading states)
- Accessibility requirements (keyboard nav, screen readers)
- Error presentation (inline, toast, modal)

## System Behaviors

- **Core invariants**: Rules that must always hold
- **Policies**: "Silent by default", confirmation requirements, retry behavior
- **State transitions**: Client and server state changes
- **Events**: What events are emitted, when, with what payload

## Data & Contracts

### Storage
- What must be persisted
- Schema changes required
- Migration considerations

### API/Events
- Endpoints involved (method, path, purpose)
- Request/response shapes (high-level, not implementation)
- Events published/consumed

## Usage/Cost Accounting

- What usage must be captured (requests, operations, resources)
- How usage is attributed (session, user, organization)
- Metering or quota considerations

## Edge Cases

| Scenario | Expected Behavior | User Sees |
|----------|-------------------|-----------|
| Network failure during save | Retry with backoff, then surface error | "Could not save. Retry?" |
| Invalid input | Reject with validation message | Inline field error |
| Concurrent edit | Last write wins / Conflict resolution | Depends on policy |

## Acceptance Criteria

Testable outcomes for the task to be considered complete:

- [ ] User can perform <action>
- [ ] System responds with <behavior>
- [ ] Error case <scenario> shows <outcome>
- [ ] Data is persisted correctly in <location>
- [ ] API returns <expected response> for <request>

## Touchpoints

Files and systems likely affected:

- `apps/backend/api/src/routers/<router>.ts` - API route
- `apps/frontend/web/src/routes/<route>.tsx` - UI component
- `db/schema.sql` - Schema changes
- `packages/backend/core/src/<module>.ts` - Business logic

## Notes

Additional context, links to discussions, or implementation hints (optional).

