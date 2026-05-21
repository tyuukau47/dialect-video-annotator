"use client";

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const hasPages = totalPages > 1;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-mist px-4 py-3 text-sm text-slate-600">
      <div>
        {totalItems} items • page {page}
        {totalPages ? ` of ${totalPages}` : ""} • {pageSize} per page
      </div>
      <div className="flex gap-2">
        <button
          className="rounded-xl border border-line bg-white px-3 py-2 font-medium"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="rounded-xl border border-line bg-white px-3 py-2 font-medium"
          disabled={!hasPages || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
