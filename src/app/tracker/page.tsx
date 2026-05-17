"use client";

export default function TrackerPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Tracker</h1>
      <p className="text-sm text-gray-500 mb-6">Encoder une action</p>
      {/* Event tiles — à remplir avec le design */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Sommeil", icon: "😴", color: "bg-indigo-100" },
          { label: "Repas", icon: "🍼", color: "bg-amber-100" },
          { label: "Tirage", icon: "🥛", color: "bg-sky-100" },
          { label: "Couche", icon: "🧷", color: "bg-green-100" },
          { label: "Soins", icon: "🛁", color: "bg-rose-100" },
          { label: "Température", icon: "🌡️", color: "bg-orange-100" },
        ].map((tile) => (
          <button
            key={tile.label}
            className={`${tile.color} rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform`}
          >
            <span className="text-4xl">{tile.icon}</span>
            <span className="text-sm font-semibold text-gray-700">
              {tile.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
