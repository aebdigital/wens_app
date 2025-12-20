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
    };
    vypracoval?: string;
    // Legacy support (optional)
    firma?: string;
    ulica?: string;
    mesto?: string;
    psc?: string;
    telefon?: string;
    email?: string;
  };
  showCustomerInfo?: boolean;
  onToggleCustomerInfo?: () => void;
  showArchitectInfo?: boolean;
  onToggleArchitectInfo?: () => void;
}

export const QuoteHeader: React.FC<QuoteHeaderProps> = ({ 
  isDark, 
  headerInfo,
  showCustomerInfo,
  onToggleCustomerInfo,
  showArchitectInfo,
  onToggleArchitectInfo
}) => {
  const customerName = headerInfo.customer
    ? (`${headerInfo.customer.priezvisko || ''} ${headerInfo.customer.meno || ''}`.trim() || headerInfo.customer.firma)
    : headerInfo.firma;
  const customerAddress = headerInfo.customer ? headerInfo.customer.ulica : headerInfo.ulica;
  const customerCity = headerInfo.customer ? `${headerInfo.customer.mesto} ${headerInfo.customer.psc}` : `${headerInfo.mesto} ${headerInfo.psc}`;
  const customerPhone = headerInfo.customer ? headerInfo.customer.telefon : headerInfo.telefon;
  const customerEmail = headerInfo.customer ? headerInfo.customer.email : headerInfo.email;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
      <div className="text-xs space-y-1">
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>WENS door, s.r.o., Vápenická 12, 971 01 Prievidza</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>zap.v OR SR Trenčín od.Sro,Vl.č. 17931 / R, č. ŽR 340-24428</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>IČO: 36792942, IČ DPH: SK2022396904</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>PRIMABANKA Slovensko a.s. č.ú.: 4520001507/3100</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>IBAN: SK4431000000004520001507, BIC (SWIFT): LUBASKBX</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>tel./fax.: 046 / 542 2057, e-mail: info@wens.sk</p>
      </div>
      
      <div className="flex gap-4">
        {/* Customer Column */}
        <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 mb-1">
                <input 
                    type="checkbox" 
                    checked={showCustomerInfo} 
                    onChange={onToggleCustomerInfo}
                    className="rounded text-[#e11b28] focus:ring-[#e11b28]"
                />
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Konečný zákazník</span>
            </div>
            <div className={`text-xs space-y-1 ${!showCustomerInfo ? 'opacity-50' : ''}`}>
                <div className="flex gap-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#meno:</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{customerName}</span>
                </div>
                <div className="flex gap-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#ulica:</span>
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{customerAddress}</span>
                </div>
                <div className="flex gap-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#mesto:</span>
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{customerCity}</span>
                </div>
                <div className="flex gap-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#kontakt:</span>
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{customerPhone}</span>
                </div>
                <div className="flex gap-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#email:</span>
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{customerEmail}</span>
                </div>
            </div>
        </div>

        {/* Architect Column */}
        {headerInfo.architect && (
            <div className="flex-1 space-y-2 border-l pl-4 border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-1">
                    <input 
                        type="checkbox" 
                        checked={showArchitectInfo} 
                        onChange={onToggleArchitectInfo}
                        className="rounded text-[#e11b28] focus:ring-[#e11b28]"
                    />
                    <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Architekt</span>
                </div>
                <div className={`text-xs space-y-1 ${!showArchitectInfo ? 'opacity-50' : ''}`}>
                    <div className="flex gap-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#meno:</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {headerInfo.architect.firma || `${headerInfo.architect.priezvisko} ${headerInfo.architect.meno}`}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#ulica:</span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{headerInfo.architect.ulica}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#mesto:</span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{headerInfo.architect.mesto} {headerInfo.architect.psc}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#kontakt:</span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{headerInfo.architect.telefon}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#email:</span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{headerInfo.architect.email}</span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
