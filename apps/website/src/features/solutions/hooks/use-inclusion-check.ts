"use client";

import { useReducer } from "react";
import type { InclusionResult, InclusionSnapshot } from "../lib/inclusion";
import { checkInclusion } from "../lib/inclusion";

interface InclusionState {
  query: string;
  result: InclusionResult;
}

type InclusionAction =
  | { type: "type"; query: string }
  | { type: "pick"; reference: string }
  | { type: "submit" };

function reducer(snapshot: InclusionSnapshot) {
  return (state: InclusionState, action: InclusionAction): InclusionState => {
    if (action.type === "type") return { query: action.query, result: { status: "idle" } };
    if (action.type === "pick") {
      return { query: action.reference, result: checkInclusion(action.reference, snapshot) };
    }
    return { ...state, result: checkInclusion(state.query, snapshot) };
  };
}

export function useInclusionCheck(snapshot: InclusionSnapshot, initialReference?: string) {
  const [state, dispatch] = useReducer(reducer(snapshot), undefined, () => ({
    query: initialReference ?? "",
    result: initialReference
      ? checkInclusion(initialReference, snapshot)
      : { status: "idle" as const },
  }));

  return {
    query: state.query,
    result: state.result,
    setQuery: (query: string) => dispatch({ type: "type", query }),
    pick: (reference: string) => dispatch({ type: "pick", reference }),
    submit: () => dispatch({ type: "submit" }),
  };
}
