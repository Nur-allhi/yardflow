export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 animate-pulse">
      {/* Header placeholder */}
      <div className="hidden md:flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-surface-container-high rounded" />
          <div className="h-4 w-40 bg-surface-container-high rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-surface-container-high rounded" />
          <div className="h-10 w-32 bg-surface-container-high rounded" />
          <div className="h-10 w-32 bg-surface-container-high rounded" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl md:rounded-lg p-4 md:p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="h-3 w-20 bg-surface-container-high rounded" />
              <div className="h-6 w-6 bg-surface-container-high rounded" />
            </div>
            <div className="h-7 w-28 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>

      {/* Content blocks */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6 bg-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
          <div className="p-5 border-b border-outline-variant">
            <div className="h-5 w-32 bg-surface-container-high rounded" />
          </div>
          <div className="divide-y divide-outline-variant/30">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-surface-container-high rounded" />
                  <div className="h-3 w-24 bg-surface-container-high rounded" />
                </div>
                <div className="text-right space-y-1.5">
                  <div className="h-4 w-20 bg-surface-container-high rounded" />
                  <div className="h-3 w-12 bg-surface-container-high rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 bg-white border border-outline-variant rounded-lg p-5 shadow-sm">
          <div className="h-5 w-36 bg-surface-container-high rounded mb-6" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-surface-container-high rounded" />
                  <div className="h-3 w-16 bg-surface-container-high rounded" />
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
