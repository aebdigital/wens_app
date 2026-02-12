import React from 'react';

interface QuoteHeaderProps {
  isDark: boolean;
  headerInfo: {
    customer?: {
      firma: string;
      ulica: string;
      mesto: string;
      psc: string;
      telefon: string;
      email: string;
      meno: string;
      priezvisko: string;
      ico?: string;
      dic?: string;
      icDph?: string;
    };
    architect?: {
      priezvisko: string;
      meno: string;
      firma: string;
      ulica: string;
      mesto: string;
      psc: string;
      telefon: string;
      email: string;
      ico?: string;
      dic?: string;
      icDph?: string;
    };
    billing?: {
      priezvisko: string;
      meno: string;
      adresa: string;
      ico: string;
      dic: string;
      icDph: string;
      telefon: string;
      email: string;
    };
    vypracoval?: string;
    // Legacy support (optional)
    firma?: string;
    ulica?: string;
    mesto?: string;
    psc?: string;
    telefon?: string;
    email?: string;
    activeSource?: string;
  };
  showCustomerInfo?: boolean;
  onToggleCustomerInfo?: () => void;
  showArchitectInfo?: boolean;
  onToggleArchitectInfo?: () => void;
  showBillingInfo?: boolean;
  onToggleBillingInfo?: () => void;
  onRefreshBilling?: () => void;
  usingSnapshot?: boolean;
}

export const QuoteHeader: React.FC<QuoteHeaderProps> = ({
  isDark,
  headerInfo,
  onRefreshBilling,
  usingSnapshot
}) => {
  // Determine which info to show based on what's available in headerInfo
  // The parent component (DvereForm/QuoteLayout) should populate the correct fields
  // based on the selected fakturaciaSource.

  let clientTitle = 'Konečný zákazník';
  let clientData: any = headerInfo.customer;

  // Logic: check which source is active.
  // We can infer this if we pass a 'source' field in headerInfo, or by checking which fields are populated/selected.
  // However, DvereStructure wraps everything.
  // Let's assume headerInfo has an 'activeSource' property or we use the 'billing' field if it's populated and intended to be used.
  // BUT the user wants it based on the TOGGLE in Vseobecne.
  // In Vseobecne:
  // - zakaznik -> fills customer fields
  // - architekt -> fills architect fields
  // - realizator -> fills billing fields
  // AND sets 'fakturaciaSource'.

  // We need to know the 'fakturaciaSource'.
  // Let's check if we can pass it in headerInfo.

  const source = headerInfo.activeSource || 'zakaznik';

  if (source === 'architekt' && headerInfo.architect) {
    clientTitle = 'Architekt - sprostredkovateľ';
    clientData = {
      firma: headerInfo.architect.firma,
      meno: headerInfo.architect.meno,
      priezvisko: headerInfo.architect.priezvisko,
      ulica: headerInfo.architect.ulica,
      mesto: headerInfo.architect.mesto,
      psc: headerInfo.architect.psc,
      telefon: headerInfo.architect.telefon,
      email: headerInfo.architect.email,
      ico: headerInfo.architect.ico,
      dic: headerInfo.architect.dic,
      icDph: headerInfo.architect.icDph
    } as any;
  } else if (source === 'realizator' && headerInfo.billing) {
    clientTitle = 'Fakturačná firma / Realizátor';
    clientData = {
      firma: '',
      meno: headerInfo.billing.meno,
      priezvisko: headerInfo.billing.priezvisko,
      ulica: headerInfo.billing.adresa,
      mesto: '',
      psc: '',
      telefon: headerInfo.billing.telefon,
      email: headerInfo.billing.email,
      ico: headerInfo.billing.ico,
      dic: headerInfo.billing.dic,
      icDph: headerInfo.billing.icDph
    } as any;
  }

  // If we are using the generic 'customer' object but with specific titles:
  if (source === 'zakaznik') clientTitle = 'Konečný zákazník';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
      <div className="text-xs space-y-1">
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>WENS DOOR s.r.o., Vápenická 12, 971 01 Prievidza</p>
        <p className={`notranslate ${isDark ? 'text-gray-300' : 'text-gray-800'}`} translate="no">zap. v OR OS Trenčín od.Sro,Vl.č. 17931 / R, č. ŽR 340-24428</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>IČO: 36792942, IČ DPH: SK2022396904</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>PRIMABANKA Slovensko a.s. č.ú.: 4520001507/3100</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>IBAN: SK4431000000004520001507, BIC (SWIFT): LUBASKBX</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>tel.: 046 / 542 2057, e-mail: info@wens.sk</p>
      </div>

      <div className="flex gap-4 justify-end">
        {clientData && (
          <div className="flex-1 max-w-xs space-y-2 text-right relative group">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{clientTitle}</span>
              {usingSnapshot && onRefreshBilling && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Naozaj chcete aktualizovať fakturačné údaje podľa aktuálneho nastavenia spisu?')) {
                      onRefreshBilling();
                    }
                  }}
                  className={`ml-2 p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                  title="Aktualizovať fakturačné údaje podľa spisu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
            <div className="text-xs space-y-0.5">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {`${clientData.priezvisko || ''} ${clientData.meno || ''}`.trim()}
              </p>
              {clientData.ulica && <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>{clientData.ulica}</p>}
              {(clientData.mesto || clientData.psc) && (
                <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>{`${clientData.mesto || ''} ${clientData.psc || ''}`.trim()}</p>
              )}

              {(clientData.ico || clientData.dic || clientData.icDph) && (
                <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                  {clientData.ico && <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>IČO: {clientData.ico}</p>}
                  {clientData.dic && <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>DIČ: {clientData.dic}</p>}
                  {clientData.icDph && <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>IČ DPH: {clientData.icDph}</p>}
                </div>
              )}

              {(clientData.telefon || clientData.email) && (
                <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                  {clientData.telefon && <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>{clientData.telefon}</p>}
                  {clientData.email && <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>{clientData.email}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
