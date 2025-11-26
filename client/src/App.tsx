import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import FormList from './components/FormList';
import FormRenderer from './components/FormRenderer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/">🏠 Home</Link>
          <Link to="/admin">⚙️ Admin Panel</Link>
        </nav>
        <Routes>
          <Route path="/" element={<FormList />} />
          <Route path="/form/:id" element={<FormRenderer />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
