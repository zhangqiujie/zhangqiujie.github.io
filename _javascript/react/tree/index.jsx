// index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import TreeWidget from './TreeWidget';

window.renderTree = function(elementId, data) {
  const container = document.getElementById(elementId);
  if (!container) return;
  createRoot(container).render(<TreeWidget data={data} />);
};