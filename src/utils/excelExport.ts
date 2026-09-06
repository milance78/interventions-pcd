import type { Intervention } from "../redux/features/newInterventionSlice";
import { formatAddressClientsForComment } from "./addressClients";

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const displayInfrastructure = (value: string) => /^(?:fiber|fibre)$/i.test(value.trim()) ? "fibre" : /^(?:copper|cuivre)$/i.test(value.trim()) ? "cuivre" : value;
const displayStatus = (value: string) => (({"on hold":"En attente", completed:"Terminé", transferred:"Transmis", postponed:"Postposé", "consult M&P":"Voir avec M&P", "closed by another agent":"Fermé par un autre agent"} as Record<string, string>)[value] ?? value) || "-";
const formatDate = (iso: string | null | undefined) => iso ? new Intl.DateTimeFormat("fr-BE", {day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(iso)) : "-";
const formatTime = (iso: string | null | undefined) => iso ? `${new Intl.DateTimeFormat("fr-BE", {hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(iso))}h` : "-";
const nonEmpty = (v: string | null | undefined) => v?.trim() || "-";
const statusFill = (status: string) => {
  if (status === "completed") return "#c7f4d5";
  if (status === "on hold") return "#fde7a8";
  if (status === "transferred") return "#cbdfff";
  if (status === "consult M&P") return "#e3d8fc";
  if (status === "closed by another agent") return "#e5e7eb";
  if (status === "postponed") return "#eadcff";
  return "#f1f5f9";
};

const snowLine = (label: string, value: string, pending: boolean, createdAt: string | null | undefined) => {
  if (!value.trim()) return "";
  return `${label}${pending ? " en attente" : ""}: ${value.trim()}, initié le ${formatDate(createdAt)} à ${formatTime(createdAt)}`;
};

export const exportInterventionsToExcel = (interventions: Intervention[], dateLabel: string, filename: string) => {
  const total = interventions.length;
  const completed = interventions.filter((item) => item.status === "completed").length;
  const headerStatus = `Status${total ? ` Total(${total})` : ""}${completed ? ` Terminé(${completed})` : ""}`;
  const rows = interventions.map((item) => {
    const clientsSegment = item.commentSegmentClientsOnAddress?.trim() || formatAddressClientsForComment(item.addressClients, item.infrastructure) || "";
    const rawComment = item.comment?.trim() || "";
    const actionComment = [item.commentSegmentClientsOnAddress?.trim(), clientsSegment]
      .filter((segment, index, list): segment is string => Boolean(segment) && list.indexOf(segment) === index)
      .reduce((text, segment) => text.replace(segment, ""), rawComment)
      .trim();
    const infoLine = (label: string, value: string) => `${escapeXml(label)}: <html:B>${escapeXml(nonEmpty(value))}</html:B>`;
    const snowLineRich = (label: string, value: string, pending: boolean, createdAt: string | null | undefined) => {
      if (!value.trim()) return "";
      return `${escapeXml(label)}${pending ? " en attente" : ""}: <html:B>${escapeXml(value.trim())}</html:B>, initié le ${formatDate(createdAt)} à ${formatTime(createdAt)}`;
    };
    const snowLines = [
      snowLineRich("Snow mentionné", item.snowMentioned, false, item.snowMentionedCreatedAt || item.createdAt),
      snowLineRich("Snow à mon nom", item.snowReceived, item.isSnowReceivedPending, item.snowReceivedCreatedAt || item.createdAt),
      snowLineRich("Snow créé", item.snowSent, item.isSnowSentPending, item.snowSentCreatedAt || item.createdAt),
    ].filter(Boolean);
    const statusLines = [
      `<html:B>${escapeXml(displayStatus(item.status))}</html:B>`,
      item.status === "postponed" ? `Postposé au ${escapeXml(nonEmpty(item.postponedDate).replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1"))}` : "",
      item.snowReceived.trim() ? (item.snowStatus === "resolved" ? "Snow résolu" : "Snow en attente") : "",
    ].filter(Boolean).join("&#10;&#10;");
    const statusStyle = (item.status || "empty").replace(/[^A-Za-z0-9_-]/g, "_");
    const infoIntervention = [infoLine("Technologie", displayInfrastructure(item.infrastructure)), infoLine("Réseau", item.network), infoLine("OAG", item.oagID), infoLine("ID", item.interventionId)].join("&#10;");
    const infoSnow = snowLines.length ? snowLines.join("&#10;") : "-";
    return `<Row>
      <Cell ss:StyleID="Body"><Data ss:Type="String">${infoIntervention}</Data></Cell>
      <Cell ss:StyleID="Body"><Data ss:Type="String">${infoSnow}</Data></Cell>
      <Cell ss:StyleID="Client"><Data ss:Type="String"><html:B>${escapeXml(nonEmpty(item.clientName))}</html:B></Data></Cell>
      <Cell ss:StyleID="Body"><Data ss:Type="String">${escapeXml(nonEmpty(clientsSegment))}</Data></Cell>
      <Cell ss:StyleID="Body"><Data ss:Type="String">${escapeXml(nonEmpty(actionComment))}</Data></Cell>
      <Cell ss:StyleID="Status_${statusStyle}"><Data ss:Type="String">${statusLines || "-"}</Data></Cell>
    </Row>`;
  }).join("");
  const safeFilename = filename.replace(/(\d{4})-(\d{2})-(\d{2})/g, "$3-$2-$1");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
<Styles>
<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="10"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Body"><Alignment ss:Vertical="Center" ss:Horizontal="Left" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#e5e7eb" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Client"><Font ss:Bold="1" ss:Size="10"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Status_completed"><Interior ss:Color="#c7f4d5" ss:Pattern="Solid"/><Font ss:Bold="1"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Status_on_hold"><Interior ss:Color="#fde7a8" ss:Pattern="Solid"/><Font ss:Bold="1"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Status_transferred"><Interior ss:Color="#cbdfff" ss:Pattern="Solid"/><Font ss:Bold="1"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Status_consult_M_P"><Interior ss:Color="#e3d8fc" ss:Pattern="Solid"/><Font ss:Bold="1"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Status_closed_by_another_agent"><Interior ss:Color="#e5e7eb" ss:Pattern="Solid"/><Font ss:Bold="1"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Status_postponed"><Interior ss:Color="#eadcff" ss:Pattern="Solid"/><Font ss:Bold="1"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Status_empty"><Interior ss:Color="#f1f5f9" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:Color="#d1d5db" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
</Styles>
<Worksheet ss:Name="Interventions">
<Table ss:ExpandedColumnCount="6" ss:ExpandedRowCount="${Math.max(total + 1, 1)}">
<Column ss:Width="190"/><Column ss:Width="230"/><Column ss:Width="180"/><Column ss:Width="240"/><Column ss:Width="300"/><Column ss:Width="150"/>
<Row ss:AutoFitHeight="0" ss:Height="30"><Cell ss:StyleID="Header"><Data ss:Type="String">Info intervention</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Info snow</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nom du client</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Clients à l&apos;adresse</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Actions/commentaire</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(headerStatus)}</Data></Cell></Row>
${rows || '<Row><Cell ss:MergeAcross="5"><Data ss:Type="String">Aucune intervention</Data></Cell></Row>'}
</Table>
<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane><ProtectContents>False</ProtectContents></WorksheetOptions>
</Worksheet>
</Workbook>`;
  const blob = new Blob([xml], {type:"application/vnd.ms-excel;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = safeFilename.endsWith(".xls") ? safeFilename : `${safeFilename}.xls`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
};
