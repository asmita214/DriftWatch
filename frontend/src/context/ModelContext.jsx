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
    try {
      const res = await getModels();
      const list = Array.isArray(res.data) ? res.data : (res.data?.models || []);
      setModels(list);
      // Automatically select first model if none selected
      if (list.length > 0 && !modelId) {
        setModelId(list[0].id);
        setModelName(list[0].model_name);
      }
    } catch (err) {
      setModelsError('Failed to load models.');
    } finally {
      setModelsLoading(false);
    }
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
