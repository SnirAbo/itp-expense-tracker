import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input, Button } from '@ui/index';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Login failed');
      return r.json();
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <h1>Sign In</h1>
      <label>Email<Input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <Button type="submit">Sign In</Button>
    </form>
  );
}

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Signup failed');
      return r.json();
    },
  });
  return (
    <form onSubmit={(e)=>{e.preventDefault();mut.mutate();}}>
      <h1>Sign Up</h1>
      <label>Email<Input value={email} onChange={(e)=>setEmail(e.target.value)} /></label>
      <label>Password<Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></label>
      <Button type="submit">Create account</Button>
    </form>
  );
}

export function ForgotReset() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const token = new URLSearchParams(location.search).get('token') || '';
  const forgot = useMutation({
    mutationFn: async () => {
      await fetch(`${API}/auth/forgot`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
    },
  });
  const reset = useMutation({
    mutationFn: async () => {
      await fetch(`${API}/auth/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }) });
    },
  });
  return (
    <div>
      <h1>Forgot / Reset</h1>
      <form onSubmit={(e)=>{e.preventDefault();forgot.mutate();}}>
        <label>Email<Input value={email} onChange={(e)=>setEmail(e.target.value)} /></label>
        <Button type="submit">Send reset link</Button>
      </form>
      <hr />
      <form onSubmit={(e)=>{e.preventDefault();reset.mutate();}}>
        <label>New password<Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></label>
        <Button type="submit" disabled={!token}>Reset</Button>
      </form>
    </div>
  );
}
