import React, { useContext } from 'react';
import { HUDContext } from './HUDContext';
import { version } from '../package.json';
import FPSStats from "react-fps-stats";

// Props for HUD: include scene selector
interface HUDProps {
  sceneType: 'three' | 'solar';
  setSceneType: (scene: 'three' | 'solar') => void;
}
const HUD: React.FC<HUDProps> = ({ sceneType, setSceneType }) => {
    const hudContext = useContext(HUDContext);

    return (
        <>
            {/* Top Left */}
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white' }}>
                {hudContext?.closestGenre}
                <div style={{
                    position: 'fixed',
                    right: 0,
                    bottom: 0,
                    margin: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>v{version}</span>
                    <select
                        value={sceneType}
                        onChange={e => setSceneType(e.target.value as 'three' | 'solar')}
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: '1px solid white',
                            borderRadius: '4px',
                            padding: '2px 4px'
                        }}
                    >
                        <option value="three">ThreeScene</option>
                        <option value="solar">SolarSystemScene</option>
                    </select>
                </div>
            </div>
            {/* Top Right */}
            <div style={{ position: 'absolute', top: 10, right: 10, color: 'white' }}>
                Controls:<br/>
                Mouse: control direction<br/>
                Spacebar: accelerate<br/>
            </div>
            <FPSStats top="auto" right="auto" bottom={10} left={10} />
        </>
    );
};

export default HUD;
