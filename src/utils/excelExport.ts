import type { Intervention } from "../redux/features/newInterventionSlice";
import { formatAddressClientsForComment } from "./addressClients";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const displayInfrastructure = (value: string) => {
  if (/^(?:fiber|fibre)$/i.test(value.trim())) return "fibre";
  if (/^(?:copper|cuivre)$/i.test(value.trim())) return "cuivre";
  return value;
};

export const exportInterventionsToExcel = (
  interventions: Intervention[],
  dateLabel: string,
  filename: string,
) => {
  const rows = interventions.map((item) => {
    const clientsSegment =
      item.commentSegmentClientsOnAddress?.trim() ||
      formatAddressClientsForComment(item.addressClients, item.infrastructure) ||
      "";
    return `
      <tr>
        <td><strong>Technologie: ${escapeHtml(displayInfrastructure(item.infrastructure))}</strong><br/>
            <strong>Réseau: ${escapeHtml(item.network || "")}</strong><br/>
            <strong>OAG: ${escapeHtml(item.oagID || "")}</strong><br/>
            <strong>ID: ${escapeHtml(item.interventionId || "")}</strong></td>
        <td><strong>Nom du client:</strong><br/>${escapeHtml(item.clientName || "")}</td>
        <td><strong>A l'adresse:</strong><br/>${escapeHtml(clientsSegment)}</td>
      </tr>`;
  }).join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,Helvetica,sans-serif;font-size:12px}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #b7b7b7;padding:8px;vertical-align:top}
    th{background:#e9e9e9;text-align:left}
  </style></head><body>
  <h3>${escapeHtml(dateLabel)}</h3>
  <table><thead><tr><th>Intervention</th><th>Client</th><th>Adresse</th></tr></thead><tbody>
  ${rows || '<tr><td colspan="3">Aucune intervention</td></tr>'}
  </tbody></table></body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
