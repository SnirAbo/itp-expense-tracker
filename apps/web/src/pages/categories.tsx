import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@ui/index';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function Categories() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['categories'], queryFn: async ()=> (await fetch(`${API}/categories`, { credentials: 'include' })).json() });
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const create = useMutation({ mutationFn: async ()=>{
    await fetch(`${API}/categories`, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name, color }) });
  }, onSuccess: ()=> qc.invalidateQueries({ queryKey: ['categories'] }) });

  return (
    <div>
      <h1>Categories</h1>
      <form onSubmit={(e)=>{e.preventDefault();create.mutate();}}>
        <Input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <Input placeholder="Color" value={color} onChange={(e)=>setColor(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      <ul>
        {(data||[]).map((c:any)=> (
          <li key={c.id}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: c.color, marginRight: 6 }} />
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
