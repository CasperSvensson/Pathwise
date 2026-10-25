"use client";

import type { ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  type Connection,
  type OnConnectEnd,
  type OnReconnect,
  type OnReconnectEnd,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { DEFAULT_EDGE_OPTIONS, NODE_TYPES } from "@/components/canvas/flow";
import { cn } from "@/lib/utils";

/**
 * Själva arbetsytan – används av BÅDE besökarvyn och editorn.
 * Skillnaden styrs av `editable`.
 *
 * `children` = allt som ligger ovanpå canvasen (toppbar, panel, zoomknappar).
 */
type Props = {
  nodes: Node[];
  edges: Edge[];
  editable: boolean;
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: (connection: Connection) => void;
  /** Kallas när man släpper en pil – även om den inte landade på ett handtag. */
  onConnectEnd?: OnConnectEnd;
  /** En befintlig pils ände dras till en ny nod. */
  onReconnect?: OnReconnect;
  onReconnectEnd?: OnReconnectEnd;
  onEdgeClick?: (edgeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  onPaneClick?: () => void;
  children?: ReactNode;
};

export function CanvasBoard({
  nodes,
  edges,
  editable,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onConnectEnd,
  onReconnect,
  onReconnectEnd,
  onEdgeClick,
  onNodeClick,
  onPaneClick,
  children,
}: Props) {
  return (
    <div className={cn("relative h-dvh w-full bg-canvas", editable ? "canvas-editable" : "canvas-readonly")}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        // Alla fyra handtag kan både starta och ta emot en pil
        connectionMode={ConnectionMode.Loose}
        connectOnClick={false}
        connectionRadius={36}
        isValidConnection={(c) => c.source !== c.target}
        // Pilar: välj genom att klicka, dra en ände för att flytta den
        edgesReconnectable={editable}
        // Vald pil ritas ovanpå noderna, så att dess ändar går att ta tag i
        elevateEdgesOnSelect
        reconnectRadius={10}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        onEdgeClick={(_, edge) => onEdgeClick?.(edge.id)}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        onPaneClick={onPaneClick}
        // Redigering
        nodesDraggable={editable}
        nodesConnectable={editable}
        edgesFocusable={editable}
        deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
        // Navigering: mellanslag + dra = panorera, scroll = zooma (som Figma)
        panActivationKeyCode="Space"
        zoomOnScroll
        minZoom={0.15}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1 }}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#3a3a3a" />
        {children}
      </ReactFlow>
    </div>
  );
}
