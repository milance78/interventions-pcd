export type DailySummary = {
  total: number;
  completed: number;
  onHold: number;
  transferred: number;
  closedByAnotherAgent: number;
};

export const calculateDailySummary = (interventions: Array<Record<string, unknown>>): DailySummary => {
  const summary: DailySummary = {
    total: interventions.length,
    completed: 0,
    onHold: 0,
    transferred: 0,
    closedByAnotherAgent: 0,
  };

  interventions.forEach((intervention) => {
    switch (intervention.status) {
      case "completed": summary.completed += 1; break;
      case "on hold": summary.onHold += 1; break;
      case "transferred": summary.transferred += 1; break;
      case "closed by another agent": summary.closedByAnotherAgent += 1; break;
      default: break;
    }
  });

  return summary;
};
