import React from 'react';
import { AnimalType } from '../types';

interface AnimalIconProps {
  animalType: AnimalType | string | null | undefined;
  className?: string;
}

const AnimalIcon: React.FC<AnimalIconProps> = ({ animalType, className = '' }) => {
  // Safely coerce to known enum or default to Other
  const type = animalType && Object.values(AnimalType).includes(animalType as AnimalType)
    ? (animalType as AnimalType)
    : AnimalType.Other;

  const icons = {
    [AnimalType.Cat]: (
      <path d="M8 2C5.5 2 3.5 4 3.5 6.5c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5C12.5 4 10.5 2 8 2zm-3 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3 4c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
    ),
    [AnimalType.Ferret]: (
      <path d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-6 7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4 5c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    ),
    [AnimalType.Rabbit]: (
      <path d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5 5c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
    ),
    [AnimalType.GuineaPig]: (
      <path d="M12 2C9.24 2 7 4.24 7 7v1c0 1.66 1.34 3 3 3h4c1.66 0 3-1.34 3-3V7c0-2.76-2.24-5-5-5zm-5 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5 5c-2.76 0-8 1.38-8 4h16c0-2.62-5.24-4-8-4z" />
    ),
    [AnimalType.Chinchilla]: (
      <path d="M12 2C9.24 2 7 4.24 7 7c0 1.66 1.34 3 3 3h4c1.66 0 3-1.34 3-3 0-2.76-2.24-5-5-5zm-5 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5 5c-3.31 0-10 1.66-10 5h20c0-3.34-6.69-5-10-5z" />
    ),
    [AnimalType.Rat]: (
      <path d="M12 2C9.24 2 7 4.24 7 7c0 1.66 1.34 3 3 3h4c1.66 0 3-1.34 3-3 0-2.76-2.24-5-5-5zm-5 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5 5c-3.31 0-10 1.66-10 5h20c0-3.34-6.69-5-10-5z" />
    ),
    [AnimalType.Other]: (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`w-5 h-5 ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      {icons[type]}
    </svg>
  );
};

export default AnimalIcon;
