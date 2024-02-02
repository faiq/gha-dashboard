export function TableHeader ({ headers }) {
  return (
    <tr>
      {
      headers.map((header, index) => {
        return <th key={index}>{header}</th>;
      })
      }
    </tr>
  );
}

export function TableRow ({ rowData, rowClassName }) {
  return (
    <tr className={rowClassName}>
    {
      rowData.map((colItem, colIndex) => {
        return <td key={colIndex}>{colItem}</td>;
      })
    }
    </tr>
  );
}

export function Table ({ TableRows, Header, tableClassName }) {
  return (
  <>
    <table className={tableClassName}>
      <thead>{Header}</thead>
      <tbody>
        {TableRows}
      </tbody>
    </table>
  </>
  );
}
