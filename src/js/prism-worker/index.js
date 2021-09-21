// This needs to be an import so it executes before Prism
import './prism-config.js';
import { highlight, languages } from 'prismjs';

self.onmessage = ({ data }) => {
  try {
    self.postMessage({
      id: data.id,
      result: highlight(data.data, languages.markup)
    });
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error.message
    });
  }
};
