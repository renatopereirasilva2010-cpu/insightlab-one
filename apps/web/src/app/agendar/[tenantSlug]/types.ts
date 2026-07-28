export interface PublicBusiness {
  name: string;
  slug: string;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  requiresProfessional: boolean;
}

export interface PublicProfessional {
  id: string;
  name: string;
  roleTitle: string | null;
  bio: string | null;
}

export interface PublicAvailabilityRule {
  startTime: string;
  endTime: string;
}
