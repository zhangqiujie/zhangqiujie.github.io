// index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import CategoryTreeWidget from './tree/CategoryTreeWidget';

window.renderCategoryTree = function(elementId, data) {
  const container = document.getElementById(elementId);
  if (!container) return;
  createRoot(container).render(<CategoryTreeWidget data={data} />);
};