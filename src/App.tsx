import React, { useState } from 'react';
import './App.css';
import ThreeScene from './ThreeScene';
import HUD from './HUD';
import { HUDContext } from './HUDContext';


const App: React.FC = () => {
  const [closestGenre, setClosestGenre] = useState<string>('');

  return (
    <HUDContext.Provider value={{ closestGenre, setClosestGenre }}>
      <ThreeScene />
      <HUD />
    </HUDContext.Provider>
  );
};

export default App;
