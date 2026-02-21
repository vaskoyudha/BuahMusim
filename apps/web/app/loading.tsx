export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Hero skeleton */}
      <div className="h-48 rounded-2xl bg-gray-200 animate-pulse" />
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
