import React from 'react'

const Paginator = ({ pageNumber, totalPages, changePage }) => {
  return (
    <div>
      <nav className="pagination is-centered is-small" role="navigation" aria-label="pagination">
        <a
          className="pagination-previous"
          onClick={() => changePage(pageNumber-1, totalPages)}
        >Previous</a>
        <a
          className="pagination-next"
          onClick={() => changePage(pageNumber+1, totalPages)}
        >Next</a>
        <ul className="pagination-list">
          <li><a
            className="pagination-link" aria-label="Goto page 1"
            onClick={() => changePage(1, totalPages)}
          >1</a></li>
          <li><span className="pagination-ellipsis">&hellip;</span></li>
          <li><a className="pagination-link is-current" aria-label={`Goto page ${pageNumber}`} aria-current="page">{pageNumber}</a></li>
          <li><span className="pagination-ellipsis">&hellip;</span></li>
          <li><a
            className="pagination-link" aria-label={`Goto page ${totalPages}`}
            onClick={() => changePage(totalPages, totalPages)}
          >{totalPages ? totalPages : '  '}</a></li>
        </ul>
      </nav>
      <hr />
    </div>
  )
}

export default Paginator
