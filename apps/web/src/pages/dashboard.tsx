import React from 'react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function Dashboard() {
  const [data, setData] = React.useState<any[]>([]);
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');

  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (start) sp.set('start', start);
    if (end) sp.set('end', end);
    fetch(`${API}/reports/category-totals?${sp.toString()}`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setData);
  }, [start, end]);

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} />
        <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} />
      </div>
      {data.length === 0 ? (
        <p>No data</p>
      ) : (
        <ul>
          {data.map((r)=> (
            <li key={r.categoryId}><span style={{ display: 'inline-block', width: 12, height: 12, background: r.color, marginRight: 6 }} />{r.name}: ${r.total.toFixed(2)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
