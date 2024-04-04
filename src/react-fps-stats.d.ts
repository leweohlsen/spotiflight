declare module 'react-fps-stats' {
    import { Component } from 'react';
  
    export interface FPSStatsProps {
      top?: string | number;
      right?: string | number;
      bottom?: string | number;
      left?: string | number;
      graphHeight?: string | number;
      graphWidth?: string | number;
    }
  
    class FPSStats extends Component<FPSStatsProps> {}
  
    export default FPSStats;
  }
  