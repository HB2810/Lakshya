import { demoWorkSnapshot } from "../data/companionDemo";
import type { Decision, WorkSnapshot } from "../../types/companion";

export type StavyaGateway = {
  getMyWorkSnapshot(): Promise<WorkSnapshot>;
  submitDecision(id: string, outcome: "approved" | "returned"): Promise<Decision>;
};

class DemoStavyaGateway implements StavyaGateway {
  private snapshot = structuredClone(demoWorkSnapshot);

  async getMyWorkSnapshot(): Promise<WorkSnapshot> {
    if (typeof window !== "undefined") {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
    return structuredClone(this.snapshot);
  }

  async submitDecision(id: string, outcome: "approved" | "returned"): Promise<Decision> {
    const decision = this.snapshot.decisions.find((item) => item.id === id);
    if (!decision) throw new Error("Decision not found");
    decision.status = outcome;
    return structuredClone(decision);
  }
}

/**
 * STRICT PRIVACY BOUNDARY:
 * Only WORK data may cross this gateway. Health, wealth, family, habits, and
 * private chat history are strictly isolated and never transmitted to this gateway.
 */
export const stavyaGateway: StavyaGateway = new DemoStavyaGateway();
