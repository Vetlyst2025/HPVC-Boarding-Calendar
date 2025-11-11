export enum AnimalType {
  Cat = 'Cat',
  Ferret = 'Ferret',
  Rabbit = 'Rabbit',
  GuineaPig = 'Guinea Pig',
  Chinchilla = 'Chinchilla',
  Rat = 'Rat',
  Other = 'Other',
}

export interface Reservation {
  id: string;
  animalName: string;
  animalType: AnimalType;
  ownerFirstName: string;
  ownerLastName: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  status?: 'active' | 'checked-out';
  created_at?: string;
}