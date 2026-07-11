import React, { createContext, useContext, useState } from 'react';

const ModelContext = createContext(null);

export const ModelProvider = ({ children }) => {
  const [modelId, setModelId] = useState(null);
  const [modelName, setModelName] = useState('');

  return (
    <ModelContext.Provider value={{ modelId, setModelId, modelName, setModelName }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) throw new Error('useModel must be used within ModelProvider');
  return context;
};
