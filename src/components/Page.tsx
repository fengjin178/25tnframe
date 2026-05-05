import React from "react";

export function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#FAF7F2] pb-24 text-[#1A1611]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] px-4 pt-4">
        <header className="sticky top-0 z-20 -mx-4 mb-3 bg-[#FAF7F2]/95 px-4 pb-3 pt-2 backdrop-blur">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#766D62]">第25帧</p>
          <h1 className="text-2xl font-black">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: T[];
  value: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div
      className={`mb-4 grid rounded-xl border border-black/5 bg-white/70 p-1 shadow-sm ${
        tabs.length === 4 ? "grid-cols-4" : tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"
      }`}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`rounded-lg px-2 py-2 text-sm font-semibold ${
            value === tab ? "bg-[#1A1611] text-white shadow-sm" : "text-[#6F665C]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
