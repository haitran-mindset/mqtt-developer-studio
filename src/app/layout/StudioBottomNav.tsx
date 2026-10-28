import React from 'react';
import { useStudioStore } from '../store/studioStore';
import { STUDIO_NAV_ITEMS } from './navigation';

export const StudioBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useStudioStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-zinc-950/95 border-t border-zinc-800/90 backdrop-blur-md flex items-center justify-around z-40 px-2 select-none shadow-2xl">
      {STUDIO_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
              isActive
                ? 'text-cyan-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-md transition-all ${isActive ? 'bg-cyan-950/60 shadow-xs ring-1 ring-cyan-500/30' : ''}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
