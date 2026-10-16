---
name: VPS database and post-merge setup
description: Deployment constraints for the shared Neon database and npm lockfiles built in Replit.
---

The application’s Neon PostgreSQL database is shared with the VPS. Do not run automatic schema migration commands from post-merge or startup hooks; review and apply schema changes explicitly.

**Why:** A development workflow can connect to the same live database used by the VPS, so an automatic schema push could affect production.

**How to apply:** Keep post-merge setup limited to dependency installation and build checks. Confirm the database target and authorization before any DDL or data migration.

When Replit’s package installer updates dependencies, inspect `package-lock.json` for `package-firewall.replit.internal` URLs before relying on it in the VPS. Preserve public npm registry tarball URLs, and resolve security blocks by updating the vulnerable parent dependency or using a compatible patched transitive version rather than bypassing the package firewall.

**Why:** Replit’s internal package host is not available to the external VPS, and the package firewall can reject vulnerable versions.

**How to apply:** After dependency changes, verify both the resolved package versions and lockfile registry URLs, then run the configured post-merge setup again.
