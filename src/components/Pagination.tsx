import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label = 'results',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-500">
        Showing {currentPage * pageSize + 1} to{' '}
        {Math.min((currentPage + 1) * pageSize, totalItems)} of{' '}
        {totalItems.toLocaleString()} {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {(() => {
          const pages: (number | string)[] = [];
          const maxVisible = 7;

          if (totalPages <= maxVisible) {
            for (let i = 0; i < totalPages; i++) pages.push(i);
          } else {
            // Always show first page
            pages.push(0);

            const start = Math.max(1, currentPage - 1);
            const end = Math.min(totalPages - 2, currentPage + 1);

            if (start > 1) pages.push('start-ellipsis');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 2) pages.push('end-ellipsis');

            // Always show last page
            pages.push(totalPages - 1);
          }

          return pages.map((page, idx) =>
            typeof page === 'string' ? (
              <span key={page} className="min-w-[36px] h-9 flex items-center justify-center text-sm text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => onPageChange(page)}
                className={`min-w-[36px] h-9 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page + 1}
              </button>
            )
          );
        })()}
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
