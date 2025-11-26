import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formsApi } from '../api/config';
import { Form } from '../types';

const FormList: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formsApi.getAll();
      setForms(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching forms:', err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Cannot connect to server. Make sure the backend is running on port 5001.');
      } else if (err.response?.status === 500) {
        setError('Server error. Check if MongoDB is connected: ' + (err.response?.data?.error || 'Unknown error'));
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load forms');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading forms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <p className="error">{error}</p>
          <button 
            className="btn btn-secondary" 
            onClick={fetchForms}
            style={{ marginTop: '1rem' }}
          >
            Retry
          </button>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            <p>Make sure:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Backend server is running on port 5001</li>
              <li>MongoDB is connected</li>
              <li>Check browser console for detailed error</li>
              <li>Run: <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>npm run dev</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Available Forms</h1>
      {forms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '1.1rem', color: '#7f8c8d', marginBottom: '1rem' }}>
            No forms available at the moment.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#95a5a6' }}>
            Check back later or contact the administrator.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {forms.map((form) => (
            <div key={form._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#2c3e50' }}>{form.title}</h2>
                {form.description && (
                  <p style={{ color: '#7f8c8d', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    {form.description}
                  </p>
                )}
              </div>
              <Link 
                to={`/form/${form._id}`} 
                className="btn btn-primary"
                style={{ marginTop: 'auto', width: '100%', textAlign: 'center', justifyContent: 'center' }}
              >
                Fill Form →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormList;

