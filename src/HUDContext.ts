import { createContext } from 'react';

interface IHUDContext {
  closestGenre: string;
  setClosestGenre: (genre: string) => void;
}

export const HUDContext = createContext<IHUDContext | undefined>(undefined);
