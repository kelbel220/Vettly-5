'use client';

import React from 'react';

export default function TestPage() {
  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      background: 'linear-gradient(to bottom right, #3002A0, #6D02F3)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px'
    }}>
      <h1>Test Page</h1>
      <p>This is a simple test page without any Firebase dependencies</p>
      <button 
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid white',
          borderRadius: '20px',
          color: 'white',
          cursor: 'pointer'
        }}
        onClick={() => alert('Button clicked!')}
      >
        Click Me
      </button>
    </div>
  );
}
