import { renderReportModule } from "../components/report-view.js";
import { REPORT_SHEETS } from "../config.js";

export function render(container) {
  renderReportModule(container, REPORT_SHEETS.volumes);
}
