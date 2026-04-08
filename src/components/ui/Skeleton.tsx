interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 space-y-4">
      <Skeleton className="w-full h-64 rounded-xl" />
      <Skeleton className="w-3/4 h-6" />
      <Skeleton className="w-1/2 h-4" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6 rounded-lg" />
        <Skeleton className="w-16 h-6 rounded-lg" />
        <Skeleton className="w-16 h-6 rounded-lg" />
      </div>
    </div>
  )
}
