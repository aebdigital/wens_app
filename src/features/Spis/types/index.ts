export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  url?: string;
  storagePath?: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
  // Legacy/Specific fields
  category?: string; // For Technicke
  sent?: string; // For Vyrobne (odoslane)
  supplier?: string; // For Technicke (dodavatel)
}

export interface SpisEntry {
  id?: string;
  stav: string;
  cisloCP: string;
  cisloZakazky: string;
  datum: string;
  kontaktnaOsoba: string;
  architekt: string;
  realizator: string;
  popis: string;
  firma: string;
  spracovatel: string;
  kategoria: string;
  terminDodania: string;
  color: string;
  isLocked?: boolean;
  fullFormData?: SpisFormData;
  konecnyZakaznik?: string;
}

export interface SpisFormData {
  // Ochrana
  predmet: string;
  cisloZakazky: string;
  odsuhlesenaKS1: string;
  odsuhlesenaKS2: string;
  ochranaDatum: string;
  firma: string;
  vypracoval: string;
  stav: string;
  kategoria: string;
  sprostredkovatel: string;
  vybavene: boolean;
  terminDokoncenia: string;
  dlzkaVyroby?: string;

  // Financie
  provizia: string;
  cena: string;
  zaloha1: string;
  zaloha1Datum: string;
  zaloha2: string;
  zaloha2Datum: string;
  doplatok: string;
  doplatokDatum: string;
  financieDeposits?: FinancieDeposit[]; // Dynamic deposits from selected price offer
  stat_note?: string; // Note for stats/cashflow view

  // Konečný zákazník
  zakaznikId?: string;
  priezvisko: string;
  meno: string;
  telefon: string;
  email: string;
  ulica: string;
  ico: string;
  mesto: string;
  psc: string;
  icDph: string;
  dic: string;
  popisProjektu: string;

  // Architekt
  architektId?: string;
  architektonickyPriezvisko: string;
  architektonickeMeno: string;
  architektonickyTelefon: string;
  architektonickyEmail: string;
  architektonickyUlica: string;
  architektonickyIco: string;
  architektonickyMesto: string;
  architektonickyPsc: string;
  architektonickyIcDph: string;
  architektonickyDic: string;

  // Realizátor
  realizatorId?: string;
  realizatorPriezvisko: string;
  realizatorMeno: string;
  realizatorTelefon: string;
  realizatorEmail: string;
  realizatorUlica: string;
  realizatorIco: string;
  realizatorMesto: string;
  realizatorPsc: string;
  realizatorIcDph: string;
  realizatorDic: string;

  // Kontaktná osoba
  kontaktnaPriezvisko: string;
  kontaktnaMeno: string;
  kontaktnaTelefon: string;
  kontaktnaEmail: string;

  // Fakturácia
  fakturaciaTyp: string;
  fakturaciaSource?: string; // To remember which button was clicked
  fakturaciaK10: boolean;
  fakturaciaPriezvisko: string;
  fakturaciaMeno: string;
  fakturaciaAdresa: string;
  fakturaciaIco: string;
  fakturaciaDic: string;
  fakturaciaIcDph: string;

  // Items
  popisItems: { datum: string, popis: string, pridal: string }[];
  cenovePonukyItems: CenovaPonukaItem[];
  objednavkyItems: ObjednavkaItem[];
  emailKomu: string;
  emailKomuText: string;
  emailPredmet: string;
  emailText: string;
  emailItems: { popis: string, nazov: string, datum: string, vyvoj: string, stav: string }[];
  meranieItems: FileItem[];
  vyrobneVykresy: FileItem[];
  fotky: { id: string, name: string, type: string, base64: string, description: string, parentId?: string | null, storagePath?: string }[];
  technickeItems: FileItem[];
  preberaciProtokol?: PreberaciProtokolData;
  isLocked?: boolean;
}

export interface ObjednavkaItem {
  id?: string;
  nazov: string;
  vypracoval: string;
  datum: string;
  popis: string;
  cisloObjednavky: string;
  dorucene: string;
  puzdraData?: PuzdraData;
}

export interface PreberaciProtokolData {
  kontaktnaOsoba?: string;
  mobil?: string;
  miestoDodavky?: string;
  predmetDiela?: string;
  miestoDatum?: string;
  datum?: string; // For the signature date if different from general
  // New editable fields
  zhotovitelInfo?: string;
  objednavatelInfo?: string;
  bankInfo?: string;
  agreementText1?: string;
  agreementText2?: string;
  zhotovitelSignatureLabel?: string;
  objednavatelSignatureLabel?: string;
}

export interface CenovaPonukaItemBase {
  id: string;
  cisloCP: string;
  cisloZakazky?: string;
  verzia: string;
  odoslane: string;
  vytvoril: string;
  popis: string;
  cenaBezDPH: number;
  cenaSDPH: number;
  selected?: boolean;
  isLocked?: boolean;
}

export type CenovaPonukaItem =
  | (CenovaPonukaItemBase & { typ: 'dvere'; data: DvereData })
  | (CenovaPonukaItemBase & { typ: 'nabytok'; data: NabytokData })
  | (CenovaPonukaItemBase & { typ: 'schody'; data: SchodyData })
  | (CenovaPonukaItemBase & { typ: 'puzdra'; data: PuzdraData });

export interface ProductPhoto {
  id: string;
  base64: string;
  description: string;
}

// Deposit (záloha) interface for dynamic deposits
export interface Deposit {
  id: string;
  label: string; // e.g. "1. záloha - pri objednávke"
  percent: number;
  amount?: number | null;
}

// Deposit with date for Financie section in Všeobecné
export interface FinancieDeposit {
  id: string;
  label: string;
  amount: string;
  datum: string;
}

export interface DvereData {
  popisVyrobkov: string;
  dvereTyp: string; // Deprecated or kept for compatibility
  zarubnaTyp: string; // Deprecated or kept for compatibility
  specifications: { id: number, type: 'dvere' | 'zarubna' | 'obklad', value: string }[];
  productPhotos?: ProductPhoto[]; // Photos for the Výrobky section
  showCustomerInfo: boolean;
  showArchitectInfo: boolean;
  vyrobky: any[];
  priplatky: any[];
  zlavaPercent: number;
  zlavaEur?: number; // Absolute EUR discount
  useZlavaPercent?: boolean; // Use percentage discount
  useZlavaEur?: boolean; // Use EUR discount
  kovanie: any[];
  montaz: any[];
  montazPoznamka: string;
  platnostPonuky: string;
  miestoDodavky: string;
  poznamkaKAdrese?: string; // New field for address note
  montazLabel?: string; // Custom label for Montáž section
  zameranie: string;
  terminDodania: string;
  platba1Percent: number;
  platba2Percent: number;
  platba3Percent: number;
  platba1Amount?: number | null; // Manual override for payment 1 amount
  platba2Amount?: number | null; // Manual override for payment 2 amount
  platba3Amount?: number | null; // Manual override for payment 3 amount
  manualCenaSDPH?: number | null; // Override for total price
  // New options
  prenesenieDP?: boolean; // Prenesenie daňovej povinnosti
  cenaDohodou?: boolean; // Cena dohodou mode
  cenaDohodouValue?: number | null; // Manual price when cena dohodou
  // Dynamic deposits (overrides fixed platba1-3 when present)
  deposits?: Deposit[];
  // Editable footer fields
  vypracoval?: string;
  kontakt?: string;
  emailVypracoval?: string;
  datum?: string;
  hiddenColumns?: string[];
  columnWidths?: { [key: string]: number };
  legalText?: string;
}

export interface NabytokData {
  popisVyrobkov: string;
  vyrobkyTyp: string;
  vyrobkyPopis: string;
  showCustomerInfo: boolean;
  showArchitectInfo: boolean;
  vyrobky: any[];
  priplatky: any[];
  zlavaPercent: number;
  zlavaEur?: number;
  useZlavaPercent?: boolean;
  useZlavaEur?: boolean;
  kovanie: any[];
  montaz: any[];
  platnostPonuky: string;
  miestoDodavky: string;
  poznamkaKAdrese?: string;
  montazLabel?: string;
  zameranie: string;
  terminDodania: string;
  platba1Percent: number;
  platba2Percent: number;
  platba3Percent: number;
  platba1Amount?: number | null;
  platba2Amount?: number | null;
  platba3Amount?: number | null;
  manualCenaSDPH?: number | null;
  prenesenieDP?: boolean;
  cenaDohodou?: boolean;
  cenaDohodouValue?: number | null;
  deposits?: Deposit[];
  vypracoval?: string;
  kontakt?: string;
  emailVypracoval?: string;
  datum?: string;
  legalText?: string;
  hiddenColumns?: string[];
  columnWidths?: { [key: string]: number };
}

export interface SchodyData {
  popisVyrobkov: string;
  vyrobkyTyp: string;
  vyrobkyPopis: string;
  showCustomerInfo: boolean;
  showArchitectInfo: boolean;
  vyrobky: any[];
  priplatky: any[];
  zlavaPercent: number;
  zlavaEur?: number;
  useZlavaPercent?: boolean;
  useZlavaEur?: boolean;
  kovanie: any[];
  montaz: any[];
  platnostPonuky: string;
  miestoDodavky: string;
  poznamkaKAdrese?: string;
  montazLabel?: string;
  zameranie: string;
  terminDodania: string;
  platba1Percent: number;
  platba2Percent: number;
  platba3Percent: number;
  platba1Amount?: number | null;
  platba2Amount?: number | null;
  platba3Amount?: number | null;
  manualCenaSDPH?: number | null;
  prenesenieDP?: boolean;
  cenaDohodou?: boolean;
  cenaDohodouValue?: number | null;
  deposits?: Deposit[];
  vypracoval?: string;
  kontakt?: string;
  emailVypracoval?: string;
  datum?: string;
  legalText?: string;
  hiddenColumns?: string[];
  columnWidths?: { [key: string]: number };
}

export interface PuzdraPolozka {
  id: number;
  nazov: string;
  kod?: string;
  mnozstvo: number;
}

export interface PuzdraData {
  dodavatel: {
    nazov: string;
    ulica: string;
    mesto: string;
    tel: string;
    email: string;
    email2: string;
  };
  zakazka: string;
  polozky: PuzdraPolozka[];
  tovarDorucitNaAdresu: {
    firma: string;
    ulica: string;
    mesto: string;
  };
  // Editable header fields
  datum?: string;
  spracoval?: string;
  kontakt?: string;
  emailSpracoval?: string;
  // Description field
  popis?: string;
}
