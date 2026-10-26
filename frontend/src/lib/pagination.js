// Page numbers to show in a pagination bar, e.g. [1, '…', 4, 5, 6, '…', 12].
// Always shows the first and last page, plus `spread` pages around the current one.
export function buildPageList(currentPage, totalPages, spread = 1) {
  const pages = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages;
    const isNearCurrent = Math.abs(page - currentPage) <= spread;

    if (isEdge || isNearCurrent) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return pages;
}
