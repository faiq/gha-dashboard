export function TableHeader({ headers }){
  return (
    headers.map((header, index) => {
      return <th key={index}>{header}</th>
    })
  )
}

export function TableRow({ rowData }){
  return ( 
    <tr>
    {
      rowData.map((colItem, colIndex) => {
        return <td key={colIndex}>{colItem}</td>
      })
    }
    </tr>
  )
}

export function Table({ TableRows, Header}) {
  return (
  <>
    <table>
      <thead>{Header}</thead>
      <tbody>
        {TableRows}
      </tbody>
    </table>
  </>
  );
}
