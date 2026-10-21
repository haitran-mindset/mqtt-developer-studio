import React from 'react';

interface HexViewerProps {
  data: string | Uint8Array;
}

export const HexViewer: React.FC<HexViewerProps> = ({ data }) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  const rows: { offset: string; hex: string[]; ascii: string }[] = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, '0');

    const hex: string[] = [];
    let ascii = '';

    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hex.push(b.toString(16).padStart(2, '0'));
        // Printable ASCII range
        if (b >= 32 && b <= 126) {
          ascii += String.fromCharCode(b);
        } else {
          ascii += '.';
        }
      } else {
        hex.push('  ');
        ascii += ' ';
      }
    }

    rows.push({ offset, hex, ascii });
  }

  if (rows.length === 0) {
    return (
      <div className="p-4 text-xs font-mono text-zinc-500">
        Empty payload (0 bytes)
      </div>
    );
  }

  return (
    <div className="font-mono text-[11px] p-2 bg-zinc-950 overflow-x-auto select-text leading-relaxed">
      <div className="text-zinc-500 border-b border-zinc-800 pb-1 mb-1 flex gap-4 select-none">
        <span className="w-20">Offset</span>
        <span className="flex-1">00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</span>
        <span className="w-36">Decoded Text</span>
      </div>
      {rows.map((row) => (
        <div key={row.offset} className="flex gap-4 hover:bg-zinc-900/60 rounded px-1">
          <span className="text-zinc-500 w-20 select-none">{row.offset}</span>
          <div className="flex-1 font-semibold text-cyan-400">
            {row.hex.slice(0, 8).join(' ')} &nbsp; {row.hex.slice(8, 16).join(' ')}
          </div>
          <span className="text-zinc-300 w-36 whitespace-pre">{row.ascii}</span>
        </div>
      ))}
    </div>
  );
};
