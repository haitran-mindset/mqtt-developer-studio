import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';
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
          stroke: selected ? '#f43f5e' : (style?.stroke || '#06b6d4'),
          strokeWidth: selected ? 2.5 : 2,
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
          className="nodrag nopan group z-20"
        >
          <button
            type="button"
            onClick={handleDelete}
            title="Click to remove connection"
            aria-label="Remove connection wire"
            className="w-5 h-5 rounded-full bg-zinc-950 border border-zinc-700 hover:border-rose-500 hover:bg-rose-500 text-zinc-400 hover:text-white flex items-center justify-center shadow-md hover:shadow-rose-500/30 transition-all duration-150 cursor-pointer opacity-70 hover:opacity-100 hover:scale-125"
          >
            <X className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
