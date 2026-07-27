# Smart Import – first version

The `Import intelligent` button is available on editable intervention pages.

Workflow:
1. Open the import dialog.
2. Press `Ctrl + V` with the complete copied NPS, SNOW, ISIS or SAFE page.
3. The raw pasted text is never displayed.
4. Recognized values are written directly to the form without a preview step.

Parsed fields include intervention/OAG/SNOW/client IDs, description, customer name, phone, infrastructure, network, status, LOM key, comment, additional information and address fields.

Address output:
- `mainAddress`: street + house number + alphanumeric suffix, then ZIP + city on the next line.
- `addressDetails`: only non-empty Boîte, Étage and Appartement lines.

The parser is deterministic and local, so no customer data leaves the browser. Its module boundary is ready for a later optional server-side AI fallback.
