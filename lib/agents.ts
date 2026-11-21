/**
 * V16: who receives the owner's request. ILLUSTRATIVE: PF would pick the top agent by deals in the building;
 * the name and figures below are invented for the prototype.
 */
export interface AgentCard {
  name: string;
  agency: string;
  superAgent: boolean;
  responseTime: string;
  dealsHere: string;
  illustrative: true;
}

export const ILLUSTRATIVE_AGENT: AgentCard = {
  name: "Agent A. (example)",
  agency: "Example Realty",
  superAgent: true,
  responseTime: "Usually replies within 1 hour",
  dealsHere: "Most deals in this building in 2026",
  illustrative: true,
};
