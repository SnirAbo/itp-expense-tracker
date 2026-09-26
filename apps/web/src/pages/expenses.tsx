import React, { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@ui/index';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function Expenses() {
  const params = new URLSearchParams(location.search);
  const [q, setQ] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [start, setStart] = useState(params.get('start') || '');
  const [end, setEnd] = useState(params.get('end') || '');
  const query = useInfiniteQuery({
    queryKey: ['expenses', q, category, start, end],
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset,
    queryFn: async ({ pageParam }) => {
      const sp = new URLSearchParams();
      if (q) sp.set('q', q);
      if (category) sp.set('category_id', category);
      if (start) sp.set('start_date', start);
      if (end) sp.set('end_date', end);
      sp.set('limit', '20');
      sp.set('offset', String(pageParam || 0));
      const r = await fetch(`${API}/expenses?${sp.toString()}`, { credentials: 'include' });
      return r.json();
    },
  });

  useMemo(()=>{
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (category) sp.set('category', category);
    if (start) sp.set('start', start);
    if (end) sp.set('end', end);
    history.replaceState(null, '', `/expenses?${sp.toString()}`);
  }, [q, category, start, end]);

  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async (payload: any) => {
      await fetch(`${API}/expenses`, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  return (
    <div>
      <h1>Expenses</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Input placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
        <Input placeholder="CategoryId" value={category} onChange={(e)=>setCategory(e.target.value)} />
        <Input type="date" value={start} onChange={(e)=>setStart(e.target.value)} />
        <Input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} />
      </div>
      <Button onClick={()=>query.fetchNextPage()}>Load more</Button>
      <ul>
        {query.data?.pages.flatMap((p:any)=>p.items).map((e:any)=> (
          <li key={e.id}>{new Date(e.expenseDate).toLocaleDateString()} - ${(e.amount/1).toFixed(2)} - {e.note}</li>
        ))}
      </ul>
      <hr />
      <h2>Add</h2>
      <Button onClick={()=> add.mutate({ amount: 12.34, expenseDate: new Date().toISOString(), note: 'Coffee' })}>Add $12.34 Coffee</Button>
    </div>
  );
}
