import { gzip } from 'pako/dist/pako_deflate.js';

self.onmessage = ({ data }) => {
  try {
    const result = gzip(data.data).buffer;
    self.postMessage({
      id: data.id,
      result,
    });
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error.message,
    });
  }
};
