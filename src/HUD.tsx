import React, { useContext } from 'react';
import { HUDContext } from './HUDContext';

const HUD: React.FC = () => {
    const hudContext = useContext(HUDContext);

    return (
        <div style={{ position: 'absolute', top: 10, left: 10, color: 'white' }}>
            Closest Genre: {hudContext?.closestGenre}
        </div>
    );
};

export default HUD;
