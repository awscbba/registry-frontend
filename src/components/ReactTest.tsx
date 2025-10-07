import React, { useEffect } from 'react';

export default function ReactTest() {
  useEffect(() => {
    console.log('React component mounted successfully!');
    (window as any).ReactTestMounted = true;
  }, []);

  return (
    <div style={{ padding: '10px', background: '#f0f0f0', margin: '10px' }}>
      <h3>React Test Component</h3>
      <p>If you see this, React is working!</p>
    </div>
  );
}
