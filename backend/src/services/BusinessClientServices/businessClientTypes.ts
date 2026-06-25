export type BusinessClientType = "physical" | "legal";

export interface BusinessClientData {
  type: BusinessClientType;
  displayName: string;
  legalName?: string | null;
  tradeName?: string | null;
  identificationType: string;
  identificationNumber: string;
  legalRepresentativeName?: string | null;
  legalRepresentativeId?: string | null;
  legalRepresentativePosition?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  province?: string | null;
  canton?: string | null;
  district?: string | null;
  notes?: string | null;
  queueId?: number | null;
}

export interface BusinessClientActor {
  id: string;
  profile: string;
}
