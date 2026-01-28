import React from 'react';

const SplashScreen = ({ phrase }) => (
  <div className="splash-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 250 }}>
    <img src="/LucanikoShopPNG-01.png" alt="Logo" className="logo-anim" style={{ maxWidth: 320, width: '90vw', marginBottom: 28 }} />
    {phrase && (
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#7c4d1e', textAlign: 'center', marginTop: 10 }}>
        {phrase}
      </div>
    )}
  </div>
);

export default SplashScreen;
