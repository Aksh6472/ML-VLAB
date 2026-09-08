// src/utils/pyodide.ts

let pyodideInstance: any = null;
let isLoading = false;
let initPromise: Promise<any> | null = null;

export async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;

  if (isLoading && initPromise) {
    return initPromise;
  }

  if (typeof window === 'undefined' || !(window as any).loadPyodide) {
    throw new Error('Pyodide script not loaded in index.html');
  }

  isLoading = true;
  
  initPromise = (async () => {
    try {
      const pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
      });
      // Optionally install pandas/numpy if we need it for ML labs
      await pyodide.loadPackage(['numpy', 'pandas', 'scikit-learn']);
      pyodideInstance = pyodide;
      return pyodide;
    } catch (err) {
      console.error('Failed to load Pyodide:', err);
      throw err;
    } finally {
      isLoading = false;
    }
  })();

  return initPromise;
}
