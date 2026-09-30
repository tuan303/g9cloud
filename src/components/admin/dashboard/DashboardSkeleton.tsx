import { Skeleton } from '@/components/ui';

/** Khung chờ khi dữ liệu chưa sẵn sàng — giữ đúng bố cục để trang không nhảy */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải tổng quan" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-40 rounded-full" />
        <Skeleton className="h-8 w-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="col-span-2 h-44 rounded-3xl lg:row-span-2 lg:h-auto" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-3xl xl:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
      <span className="sr-only">Đang tải dữ liệu…</span>
    </div>
  );
}
