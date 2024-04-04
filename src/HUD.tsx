import React, { useContext } from 'react';
import { HUDContext } from './HUDContext';
import { version } from '../package.json';
import FPSStats from "react-fps-stats";

const HUD: React.FC = () => {
    const hudContext = useContext(HUDContext);

    return (
        <>
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white' }}>
                {hudContext?.closestGenre}
                <div style={{
                    position: 'fixed',
                    right: 0,
                    bottom: 0,
                    margin: '10px'
                }}>
                    v{version}
                </div>
            </div>
            <FPSStats top="auto" right="auto" bottom={10} left={10} />
        </>
    );
};

export default HUD;
