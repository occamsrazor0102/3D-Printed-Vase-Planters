import React, { useState } from 'react';
import { VaseParams, ParamMeta, paramMeta } from '../vaseParams';

interface ParamPanelProps {
  params: VaseParams;
  onChange: (params: VaseParams) => void;
}

const ParamPanel: React.FC<ParamPanelProps> = ({ params, onChange }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups: Record<string, ParamMeta[]> = {};
  for (const meta of paramMeta) {
    if (!groups[meta.group]) groups[meta.group] = [];
    groups[meta.group].push(meta);
  }

  const toggleGroup = (group: string) => {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleChange = (key: keyof VaseParams, value: number | boolean) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="param-panel">
      <h2 className="panel-title">Parameters</h2>
      {Object.entries(groups).map(([group, metas]) => (
        <div key={group} className="param-group">
          <div className="group-header" onClick={() => toggleGroup(group)}>
            <span className="group-toggle">{collapsed[group] ? '▶' : '▼'}</span>
            <span className="group-title">{group}</span>
          </div>
          {!collapsed[group] && (
            <div className="group-body">
              {metas.map((meta) => (
                <div key={meta.key} className="param-row">
                  {meta.type === 'boolean' ? (
                    <label className="param-label-bool">
                      <input
                        type="checkbox"
                        checked={params[meta.key] as boolean}
                        onChange={(e) => handleChange(meta.key, e.target.checked)}
                      />
                      {meta.label}
                    </label>
                  ) : (
                    <>
                      <label className="param-label">{meta.label}</label>
                      <div className="param-control">
                        <input
                          type="range"
                          min={meta.min}
                          max={meta.max}
                          step={meta.step}
                          value={params[meta.key] as number}
                          onChange={(e) => handleChange(meta.key, parseFloat(e.target.value))}
                        />
                        <input
                          type="number"
                          min={meta.min}
                          max={meta.max}
                          step={meta.step}
                          value={params[meta.key] as number}
                          onChange={(e) => handleChange(meta.key, parseFloat(e.target.value))}
                          className="param-number"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ParamPanel;
