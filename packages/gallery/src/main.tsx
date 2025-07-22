import React from 'react';
import ReactDOM from 'react-dom/client';
import GalleryPage from './GalleryPage';
import './effects/colorTransition.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GalleryPage imgList={[]} />
  </React.StrictMode>,
);