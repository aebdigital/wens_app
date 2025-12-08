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
  fullFormData?: SpisFormData;
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

  // Financie
  provizia: string;
  cena: string;
  zaloha1: string;
  zaloha1Datum: string;
  zaloha2: string;
  zaloha2Datum: string;
  doplatok: string;
  doplatokDatum: string;

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
  fakturaciaK10: boolean;
  fakturaciaPriezvisko: string;
  fakturaciaMeno: string;
  fakturaciaAdresa: string;

  // Items
  popisItems: {datum: string, popis: string, pridat: string, zodpovedny: string}[];
  cenovePonukyItems: CenovaPonukaItem[];
  objednavkyItems: {id?: string, nazov: string, vypracoval: string, datum: string, popis: string, cisloObjednavky: string, dorucene: string}[];
  emailKomu: string;
  emailKomuText: string;
  emailPredmet: string;
  emailText: string;
  emailItems: {popis: string, nazov: string, datum: string, vyvoj: string, stav: string}[];
  meranieItems: {datum: string, popis: string, pridat: string, zodpovedny: string}[];
  vyrobneVykresy: {popis: string, nazov: string, odoslane: string, vytvoril: string}[];
  fotky: {id: string, name: string, type: string, base64: string, description: string}[];
  technickeItems: {nazov: string, datum: string, kategoria: string, dodavatel: string}[];
}

export interface CenovaPonukaItem {
  id: string;
  cisloCP: string;
  verzia: string;
  odoslane: string;
  vytvoril: string;
  popis: string;
  typ: 'dvere' | 'nabytok' | 'puzdra';
  cenaBezDPH: number;
  cenaSDPH: number;
  data: any; // We can refine this later with DvereData | NabytokData | PuzdraData
}

export interface DvereData {
  popisVyrobkov: string;
  dvereTyp: string;
  zarubnaTyp: string;
  vyrobky: any[];
  priplatky: any[];
  zlavaPercent: number;
  kovanie: any[];
  montaz: any[];
  montazPoznamka: string;
  platnostPonuky: string;
  miestoDodavky: string;
  zameranie: string;
  terminDodania: string;
  platba1Percent: number;
  platba2Percent: number;
  platba3Percent: number;
}

export interface NabytokData {
  popisVyrobkov: string;
  vyrobkyTyp: string;
  vyrobkyPopis: string;
  vyrobky: any[];
  priplatky: any[];
  zlavaPercent: number;
  kovanie: any[];
  montaz: any[];
  platnostPonuky: string;
  miestoDodavky: string;
  zameranie: string;
  terminDodania: string;
  platba1Percent: number;
  platba2Percent: number;
  platba3Percent: number;
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
  polozky: any[];
  tovarDorucitNaAdresu: {
    firma: string;
    ulica: string;
    mesto: string;
  };
}
