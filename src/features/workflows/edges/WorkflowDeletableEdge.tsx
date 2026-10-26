import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { X, Power } from 'lucide-react';
import { toast } from 'sonner';

export const WorkflowDeletableEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}) => {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isDisabled = Boolean(data?.disabled);

  const handleToggleDisable = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: {
              ...(edge.data || {}),
              disabled: !isDisabled,
            },
          };
        }
        return edge;
      })
    );
    toast.info(isDisabled ? 'Connection enabled' : 'Connection disabled (branch will be skipped)');
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
    toast.info('Connection removed');
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#f43f5e' : isDisabled ? '#71717a' : (style?.stroke || '#06b6d4'),
          strokeWidth: selected ? 2.5 : 2,
          strokeDasharray: isDisabled ? '6,6' : (style?.strokeDasharray || undefined),
          opacity: isDisabled ? 0.45 : 1,
        }}
        interactionWidth={30}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan group z-20 flex items-center gap-1 bg-zinc-950/90 border border-zinc-800 rounded-full px-1 py-0.5 shadow-lg backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={handleToggleDisable}
            title={isDisabled ? 'Enable connection' : 'Disable connection (skip this branch)'}
            aria-label="Toggle connection"
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
              isDisabled
                ? 'text-amber-400 hover:text-emerald-400 bg-amber-950/40 hover:bg-emerald-950/50'
                : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
            }`}
          >
            <Power className="w-2.5 h-2.5" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Click to remove connection"
            aria-label="Remove connection wire"
            className="w-4 h-4 rounded-full text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 flex items-center justify-center transition-all"
          >
            <X className="w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
