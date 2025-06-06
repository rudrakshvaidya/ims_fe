import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Your page imports
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Signup from './pages/signup';
import Players from './pages/players';
import Teams from './pages/teams';
import PlayerStats from './pages/playerstats';
import TeamStats from './pages/teamstats';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/players" element={<Players />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/playerstats/:id" element={<PlayerStats />} />
        <Route path="/teamstats/:id" element={<TeamStats />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
