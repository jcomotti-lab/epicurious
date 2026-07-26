import { renderCrudModule } from "../components/crud-table.js";
import { SHEET_SCHEMAS } from "../config.js";

export function render(container) {
  renderCrudModule(container, SHEET_SCHEMAS.achats);
}
