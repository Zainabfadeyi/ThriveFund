# Content Module

Static/reference data endpoints — categories, banks, and FAQ content. All public, no auth required.

## Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET    | `/api/v1/categories` | Public | Available |
| GET    | `/api/v1/banks/supported` | Public | Available |
| GET    | `/api/v1/content/faqs` | Public | Available |

## Notes

- Data is currently hardcoded in the controller for stable demo/reference content.
- `/categories` is used by the create-goal form dropdown.
- `/banks/supported` is used by the landing page FAQ.
- `/content/faqs` is used by the landing page FAQ section.
- This router is mounted at three prefixes in `app.ts`: `/categories`, `/banks`, and `/content`.
