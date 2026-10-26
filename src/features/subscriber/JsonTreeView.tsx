import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface JsonTreeNodeProps {
  label?: string;
  value: any;
  path: string;
  isLast?: boolean;
}

export const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({
  label,
  value,
  path,
  isLast = true,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
    setCopied(true);
    toast.success(`Copied path: ${path}`);
    setTimeout(() => setCopied(false), 1200);
  };

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (isObject) {
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;

    return (
      <div className="font-mono text-xs leading-5">
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 hover:bg-zinc-900/60 rounded px-1 cursor-pointer group"
        >
          {!isEmpty && (
            <span className="text-zinc-500">
              {collapsed ? (
                <ChevronRight className="h-3 w-3 inline" />
              ) : (
                <ChevronDown className="h-3 w-3 inline" />
              )}
            </span>
          )}

          {label && <span className="text-zinc-200 font-semibold">{label}: </span>}

          <span className="text-zinc-400">
            {isArray ? `Array(${keys.length}) [` : `Object {`}
            {collapsed && ` ... ${isArray ? ']' : '}'}`}
          </span>

          <button
            onClick={handleCopyValue}
            className="opacity-0 group-hover:opacity-100 p-0.5 ml-2 hover:text-cyan-400 text-zinc-500 transition-opacity"
            title="Copy JSON subtree"
          >
            {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
          </button>
        </div>

        {!collapsed && !isEmpty && (
          <div className="pl-4 border-l border-zinc-800 ml-2">
            {keys.map((k, idx) => (
              <JsonTreeNode
                key={k}
                label={isArray ? undefined : k}
                value={value[k]}
                path={path ? `${path}.${k}` : k}
                isLast={idx === keys.length - 1}
              />
            ))}
          </div>
        )}

        {!collapsed && !isEmpty && (
          <div className="text-zinc-400 pl-4">{isArray ? ']' : '}'}</div>
        )}
      </div>
    );
  }

  // Primitive value
  let formattedValue: React.ReactNode = String(value);
  let valueColor = 'text-zinc-300';

  if (typeof value === 'string') {
    formattedValue = `"${value}"`;
    valueColor = 'text-emerald-400';
  } else if (typeof value === 'number') {
    valueColor = 'text-cyan-400';
  } else if (typeof value === 'boolean') {
    valueColor = 'text-amber-400';
  } else if (value === null) {
    formattedValue = 'null';
    valueColor = 'text-rose-400';
  }

  return (
    <div className="flex items-center gap-1.5 hover:bg-zinc-900/60 rounded px-1 group font-mono text-xs leading-5">
      {label && <span className="text-zinc-300">{label}: </span>}
      <span className={valueColor}>{formattedValue}</span>
      {!isLast && <span className="text-zinc-500">,</span>}

      <button
        onClick={handleCopyValue}
        className="opacity-0 group-hover:opacity-100 p-0.5 ml-1 hover:text-cyan-400 text-zinc-500 transition-opacity"
        title="Copy field value"
      >
        {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
      </button>
    </div>
  );
};

export const JsonTreeView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="p-3 bg-zinc-950 font-mono text-xs overflow-auto">
      <JsonTreeNode value={data} path="$" />
    </div>
  );
};
