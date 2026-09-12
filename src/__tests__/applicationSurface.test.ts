/** Broad application-surface regression checks.
 * These tests intentionally verify that every major route/module can be imported
 * without throwing at module-evaluation time. UI behavior is covered by the
 * component tests in this suite once the DOM test dependencies are installed.
 */
import { describe, expect, it } from 'vitest';

const modules = [
  '../pages/todayListPage/TodayListPage',
  '../pages/currentInterventionPage/CurrentInterventionPage',
  '../pages/historyPage/HistoryPage',
  '../pages/loginPage/LoginPage',
  '../pages/searchResultsPage/SearchResultsPage',
  '../pages/statisticsPage/StatisticsPage',
  '../pages/templatesPage/TemplatesPage',
  '../pages/onHoldPage/OnHoldPage',
  '../components/header/Header',
  '../components/header/interventionSearch/InterventionSearch',
  '../components/currentIntervention/inputsAll/InputsAll',
  '../components/currentIntervention/inputsCopper/InputsCopper',
  '../components/currentIntervention/inputsFiber/InputsFiber',
  '../components/currentIntervention/clientsOnAddress/ClientsOnAddress',
  '../components/smartImportDialog/SmartImportDialog',
  '../components/additionalInformationDialog/AdditionalInformationDialog',
  '../components/confirmDeleteDialog/ConfirmDeleteDialog',
];

describe('application surface', () => {
  it.each(modules)('module %s remains importable', async (modulePath) => {
    const loaded = await import(modulePath);
    expect(loaded).toBeTruthy();
  }, 15000);
});
