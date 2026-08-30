import { initialPrivateState } from "../data/companionDemo";
import type { PrivateState } from "../../types/companion";

const storageKey = "stavya-one-private-v1";

export function loadPrivateState(): PrivateState {
  if (typeof window === "undefined") {
    return structuredClone(initialPrivateState);
  }
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return { ...initialPrivateState, ...JSON.parse(saved) } as PrivateState;
  } catch {
    // Fail closed to a fresh private state if local storage is unavailable.
  }
  return structuredClone(initialPrivateState);
}

export function savePrivateState(state: PrivateState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to persist private vault state to localStorage:", e);
  }
}

export function clearPrivateState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey);
  } catch (e) {
    console.warn("Failed to clear private vault state from localStorage:", e);
  }
}

export function exportPrivateState(state: PrivateState): void {
  if (typeof window === "undefined") return;
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stavya-one-private-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Failed to export private vault state:", e);
  }
}
