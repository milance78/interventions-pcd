EMERGENCY FIX — v81

- Restored the complete InputsAll.tsx component.
- Restored its default export.
- Removed only the ID and OAG icon usages/imports.
- SVG asset files remain untouched.
- Removed the IDENTIFIANTS PRINCIPAUX caption.
- Changed the panel from soft blue to soft light gray.
- Manifest check: public/site.webmanifest is valid JSON. The browser error is likely a stale cached request or a dev-server fallback response, not malformed project JSON.

IMPORTANT:
v80 accidentally replaced InputsAll.tsx with a comment-only placeholder.
This patch contains the complete corrected source file, not instructions.
