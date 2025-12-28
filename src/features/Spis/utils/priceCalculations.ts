export const calculateDvereTotals = (data: any) => {
  const vyrobkyTotal = data.vyrobky.reduce((sum: number, item: any) => {
    const dverePrice = (item.ks || 0) * (item.cenaDvere || 0);
    const zarubnaPrice = (item.ksZarubna || 0) * (item.cenaZarubna || 0);
    const obkladPrice = (item.ksObklad || 0) * (item.cenaObklad || 0);
    const prazdnePrice = (item.ksPrazdne || 0) * (item.cenaPrazdne || 0);
    return sum + dverePrice + zarubnaPrice + obkladPrice + prazdnePrice;
  }, 0);
  const priplatkyTotal = data.priplatky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const subtotal = vyrobkyTotal + priplatkyTotal;
  const zlava = subtotal * data.zlavaPercent / 100;
  const afterZlava = subtotal - zlava;
  const kovanieTotal = data.kovanie.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const montazTotal = data.montaz.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);

  const cenaBezDPH_calculated = afterZlava + kovanieTotal + montazTotal;
  const dph_calculated = cenaBezDPH_calculated * 0.23;
  const cenaSDPH_calculated = cenaBezDPH_calculated + dph_calculated;

  const cenaSDPH = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null 
    ? data.manualCenaSDPH 
    : cenaSDPH_calculated;
    
  // If manual override, back-calculate DPH and Base
  const cenaBezDPH = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null
    ? cenaSDPH / 1.23
    : cenaBezDPH_calculated;
    
  const dph = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null
    ? cenaSDPH - cenaBezDPH
    : dph_calculated;

  return {
    vyrobkyTotal,
    priplatkyTotal,
    subtotal,
    zlava,
    afterZlava,
    kovanieTotal,
    montazTotal,
    cenaBezDPH,
    dph,
    cenaSDPH
  };
};

export const calculateNabytokTotals = (data: any) => {
  const vyrobkyTotal = data.vyrobky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const priplatkyTotal = data.priplatky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const subtotal = vyrobkyTotal + priplatkyTotal;
  const zlava = subtotal * data.zlavaPercent / 100;
  const afterZlava = subtotal - zlava;
  const kovanieTotal = data.kovanie.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const montazTotal = data.montaz.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const cenaBezDPH_calculated = afterZlava + kovanieTotal + montazTotal;
  const dph_calculated = cenaBezDPH_calculated * 0.23;
  const cenaSDPH_calculated = cenaBezDPH_calculated + dph_calculated;

  const cenaSDPH = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null 
    ? data.manualCenaSDPH 
    : cenaSDPH_calculated;
    
  const cenaBezDPH = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null
    ? cenaSDPH / 1.23
    : cenaBezDPH_calculated;
    
  const dph = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null
    ? cenaSDPH - cenaBezDPH
    : dph_calculated;

  return {
    vyrobkyTotal,
    priplatkyTotal,
    subtotal,
    zlava,
    afterZlava,
    kovanieTotal,
    montazTotal,
    cenaBezDPH,
    dph,
    cenaSDPH
  };
};

export const calculatePuzdraTotals = (data: any) => {
  // Assuming Puzdra has simple items sum logic
  const itemsTotal = data.polozky ? data.polozky.reduce((sum: number, item: any) => sum + (item.cena || 0), 0) : 0;
  return { cenaBezDPH: itemsTotal, dph: itemsTotal * 0.23, cenaSDPH: itemsTotal * 1.23 };
};

export const calculateSchodyTotals = (data: any) => {
  const vyrobkyTotal = data.vyrobky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const priplatkyTotal = data.priplatky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const subtotal = vyrobkyTotal + priplatkyTotal;
  const zlava = subtotal * data.zlavaPercent / 100;
  const afterZlava = subtotal - zlava;
  const kovanieTotal = data.kovanie.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const montazTotal = data.montaz.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const cenaBezDPH_calculated = afterZlava + kovanieTotal + montazTotal;
  const dph_calculated = cenaBezDPH_calculated * 0.23;
  const cenaSDPH_calculated = cenaBezDPH_calculated + dph_calculated;

  const cenaSDPH = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null 
    ? data.manualCenaSDPH 
    : cenaSDPH_calculated;
    
  const cenaBezDPH = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null
    ? cenaSDPH / 1.23
    : cenaBezDPH_calculated;
    
  const dph = data.manualCenaSDPH !== undefined && data.manualCenaSDPH !== null
    ? cenaSDPH - cenaBezDPH
    : dph_calculated;

  return {
    vyrobkyTotal,
    priplatkyTotal,
    subtotal,
    zlava,
    afterZlava,
    kovanieTotal,
    montazTotal,
    cenaBezDPH,
    dph,
    cenaSDPH
  };
};
