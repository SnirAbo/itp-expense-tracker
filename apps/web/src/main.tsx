import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignIn, SignUp, ForgotReset } from './pages/auth.js';
import { Categories } from './pages/categories.js';
import { Expenses } from './pages/expenses.js';
import { Dashboard } from './pages/dashboard.js';

const qc = new QueryClient();

function Layout() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to="/">Dashboard</Link>
        <Link to="/expenses">Expenses</Link>
        <Link to="/categories">Categories</Link>
        <Link to="/auth/signin" style={{ marginLeft: 'auto' }}>Sign In</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/reset" element={<ForgotReset />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
