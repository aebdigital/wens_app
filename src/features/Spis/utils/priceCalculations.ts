export const calculateDvereTotals = (data: any) => {
  const vyrobkyTotal = data.vyrobky.reduce((sum: number, item: any) => {
    const dverePrice = (item.ks || 0) * (item.cenaDvere || 0);
    const zarubnaPrice = (item.ksZarubna || 0) * (item.cenaZarubna || 0);
    const obkladPrice = (item.ksObklad || 0) * (item.cenaObklad || 0);
    return sum + dverePrice + zarubnaPrice + obkladPrice;
  }, 0);
  const priplatkyTotal = data.priplatky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const subtotal = vyrobkyTotal + priplatkyTotal;
  const zlava = subtotal * data.zlavaPercent / 100;
  const afterZlava = subtotal - zlava;
  const kovanieTotal = data.kovanie.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const montazTotal = data.montaz.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
  const cenaBezDPH = afterZlava + kovanieTotal + montazTotal;
  const dph = cenaBezDPH * 0.23;
  const cenaSDPH = cenaBezDPH + dph;

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
  const cenaBezDPH = afterZlava + kovanieTotal + montazTotal;
  const dph = cenaBezDPH * 0.23;
  const cenaSDPH = cenaBezDPH + dph;

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
