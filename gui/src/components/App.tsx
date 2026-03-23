import React, { useState, useCallback } from 'react';
import { VaseParams, defaultParams } from '../vaseParams';
import VasePreview from './VasePreview';
import ParamPanel from './ParamPanel';
import { generateScadCode } from './scadExport';

const App: React.FC = () => {
  const [params, setParams] = useState<VaseParams>({ ...defaultParams });
  const [showCode, setShowCode] = useState(false);

  const handleParamChange = useCallback((newParams: VaseParams) => {
    setParams(newParams);
  }, []);

  const handleExport = () => {
    const code = generateScadCode(params);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom_vase.scad';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌸 Parametric Vase Designer</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset Defaults
          </button>
          <button className="btn btn-secondary" onClick={() => setShowCode(!showCode)}>
            {showCode ? 'Hide Code' : 'Show OpenSCAD Code'}
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export .scad
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <ParamPanel params={params} onChange={handleParamChange} />
        </aside>
        <main className="preview-area">
          {showCode ? (
            <div className="code-view">
              <pre>{generateScadCode(params)}</pre>
            </div>
          ) : (
            <VasePreview params={params} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
