function Block({ className = "" }: { className?: string }) {
  return <div className={"animate-pulse rounded-lg bg-surface2 " + className} />;
}

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Block className="h-6 w-44" />
          <Block className="h-4 w-64" />
        </div>
        <Block className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-5">
            <Block className="h-4 w-24" />
            <Block className="h-7 w-16" />
            <Block className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-3 p-5 lg:col-span-2">
          <Block className="h-4 w-40" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Block key={i} className="h-3 w-full" />
          ))}
        </div>
        <div className="card space-y-3 p-5">
          <Block className="h-4 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Block key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="card space-y-3 p-5">
        <Block className="h-9 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
