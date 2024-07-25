import React from 'react';
import styles from '../styles/pagination.module.css';

const Pagination = ({ tableInstance }) => {
    const {
        state,
        gotoPage,
        pageCount,
        pageOptions,
        canPreviousPage,
        canNextPage,
        nextPage,
        previousPage,
        setPageSize,
    } = tableInstance;

    const { pageIndex, pageSize } = state;

    return (
        <div className={styles['pagination-container']}>
            <span>
                Page{' '}
                <strong>
                    {pageIndex + 1} of {pageOptions.length}
                </strong>
            </span>
            <span>
                | Go to Page: {' '}
                <input
                    type='number'
                    value={pageIndex + 1}
                    onChange={e => {
                        const pageNumber = e.target.value ? Number(e.target.value) - 1 : 0;
                        gotoPage(pageNumber);
                    }}
                    className={styles['pagination-input']}
                />
            </span>
            <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className={styles['pagination-select']}
            >
                {[10, 25, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                        Show {pageSize}
                    </option>
                ))}
            </select>
            <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                {'<<'}
            </button>
            <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                Previous
            </button>
            <button onClick={() => nextPage()} disabled={!canNextPage}>
                Next
            </button>
            <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                {'>>'}
            </button>
        </div>
    );
};

export default Pagination;
