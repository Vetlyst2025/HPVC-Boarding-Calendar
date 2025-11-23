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
  created_at?: string;

  // These exact quoted names match your Supabase column names (CamelCase with capitals)
  "animalName": string;
  "animalType"?: AnimalType | null;
  "ownerFirstName": string;
  "ownerLastName": string;
  "startDate": string | Date;   // Supabase returns string, we convert later
  "endDate": string | Date;
  notes?: string | null;
  status?: 'active' | 'checked-out' | null;
}
