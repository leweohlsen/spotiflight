import React, { useState } from 'react';
import './App.css';
import SolarSystemScene from './SolarSystemScene';
import ThreeScene from './ThreeScene';
import HUD from './HUD';
import { HUDContext } from './HUDContext';


// Available scenes
type SceneType = 'three' | 'solar';
const App: React.FC = () => {
  const [closestGenre, setClosestGenre] = useState<string>('');
  const [sceneType, setSceneType] = useState<SceneType>('three');

  return (
    <HUDContext.Provider value={{ closestGenre, setClosestGenre }}>
      {/* Render selected scene */}
      {sceneType === 'three' ? <ThreeScene /> : <SolarSystemScene />}
      {/* HUD with scene switcher */}
      <HUD sceneType={sceneType} setSceneType={setSceneType} />
    </HUDContext.Provider>
  );
};

export default App;
