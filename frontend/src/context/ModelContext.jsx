import React, { createContext, useContext, useState, useEffect } from 'react';
import { getModels } from '../api/client';

const ModelContext = createContext(null);

export const ModelProvider = ({ children }) => {
  const [modelId, setModelId] = useState(null);
  const [modelName, setModelName] = useState('');
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(null);

  const refreshModels = async () => {
  setModelsLoading(true); setModelsError(null);
  let list = [];
  try {
    const res = await getModels();
    list = Array.isArray(res.data) ? res.data : (res.data?.models || []);
    setModels(list);
    if (list.length > 0 && !modelId) {
      setModelId(list[0].id);
      setModelName(list[0].model_name);
    }
  } catch (err) {
    // auth failed or no models — still try to show demo
    list = [];
  }

  // show demo model if user has no models
  if (list.length === 0) {
    try {
      const { getDemoModel } = await import('../api/client');
      const demoRes = await getDemoModel();
      const demoModel = demoRes.data?.model;
      if (demoModel) {
        setModels([{ ...demoModel, is_demo: true, model_name: 'churn_predictor (demo)' }]);
        if (!modelId) {
          setModelId(demoModel.id);
          setModelName('churn_predictor (demo)');
        }
      }
    } catch {
      setModelsError('Failed to load models.');
    }
  }

  setModelsLoading(false);
};

  useEffect(() => { refreshModels(); }, []);

  return (
    <ModelContext.Provider value={{ modelId, setModelId, modelName, setModelName, models, modelsLoading, modelsError, refreshModels }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) throw new Error('useModel must be used within ModelProvider');
  return context;
};
