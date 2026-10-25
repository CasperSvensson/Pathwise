"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CanvasWidgetState, WidgetInstance, WidgetResponseValue } from "@/components/widgets/types";
import type { HandleSide } from "@/lib/canvas/types";
import type { DropTarget } from "@/lib/canvas/layout";

/** Skicka in ett svar. Returnerar ett felmeddelande, eller null om det gick bra. */
export type CanvasRespondFn = (nodeId: string, widget: WidgetInstance, value: WidgetResponseValue) => Promise<string | null>;

/**
 * Delad information till alla noder på canvasen, utan att behöva skicka
 * den genom varje nods data:
 *  - siffror och egna svar för widgets
 *  - funktionen som skickar in ett svar (saknas i editorn = förhandsvisning)
 *  - om canvasen är redigerbar
 *  - vad som händer när man klickar på ett nodhandtag (bara i editorn)
 *  - vilket handtag en dragen pil kommer att fästa vid (bara i editorn)
 */
type CanvasRuntime = {
  editable: boolean;
  widgetState: CanvasWidgetState;
  onRespond?: CanvasRespondFn;
  onAddBeside?: (nodeId: string, side: HandleSide) => void;
  /** Medan en pil dras: noden och sidan den kommer att fästa vid. */
  dropTarget?: DropTarget | null;
};

const EMPTY_STATE: CanvasWidgetState = { counts: {}, myResponses: {} };

const Context = createContext<CanvasRuntime>({ editable: false, widgetState: EMPTY_STATE });

export function CanvasRuntimeProvider({ value, children }: { value: Partial<CanvasRuntime>; children: ReactNode }) {
  return (
    <Context.Provider value={{ editable: false, widgetState: EMPTY_STATE, ...value }}>
      {children}
    </Context.Provider>
  );
}

export function useCanvasRuntime() {
  return useContext(Context);
}
