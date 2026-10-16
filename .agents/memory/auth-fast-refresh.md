---
name: Authentication context and Vite Fast Refresh
description: Keep one React auth context instance stable across Vite hot updates.
---

The shared `AuthContext` must live in a separate, stable module. `AuthProvider` and `useAuth` should import the same context module; do not define the context in the same file that exports both the provider component and hook. When Vite Fast Refresh invalidates mixed exports, the hook module can reload while the provider retains the old context instance. A clean restart only hides the mismatch temporarily.

**Why:** Vite invalidated `useAuth` as an incompatible Fast Refresh export, and `Router` then threw despite being mounted beneath `AuthProvider`.

**How to apply:** Keep context, provider, and hook in separate modules, preserve the guard that throws when no provider exists, and check the browser console after auth-module HMR updates.
