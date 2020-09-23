import React from 'react'

const PageTotals = ({ pageSize, pageNumber, totalCount, entities }) => {
  const itemEnd = (pageSize * pageNumber) >= totalCount ? totalCount : pageSize * pageNumber
  const itemStart = (pageSize*pageNumber) >= totalCount ? 1 : itemEnd - pageSize + 1
  return (
    <div className="list-totals"><small>{itemStart} to {itemEnd} of {totalCount} {entities}</small></div>        
  )
}

export default PageTotals