import React from 'react';
import { QuoteHeader } from './QuoteHeader';
import { QuoteFooter } from './QuoteFooter';

interface QuoteLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  headerInfo: any; // Using any to avoid strict typing conflict during transition, or could copy the type from QuoteHeader
  data: any;
  onChange: (data: any) => void;
  totals: {
    cenaBezDPH: number;
    dph: number;
    cenaSDPH: number;
  };
  defaultLegalText?: string;
}

export const QuoteLayout: React.FC<QuoteLayoutProps> = ({
  children,
  isDark,
  headerInfo,
  data,
  onChange,
  totals,
  defaultLegalText
}) => {
  return (
    <div className="space-y-4">
      <QuoteHeader
        isDark={isDark}
        headerInfo={headerInfo}
        showCustomerInfo={data.showCustomerInfo}
        onToggleCustomerInfo={() => onChange({ ...data, showCustomerInfo: !data.showCustomerInfo })}
        showArchitectInfo={data.showArchitectInfo}
        onToggleArchitectInfo={() => onChange({ ...data, showArchitectInfo: !data.showArchitectInfo })}
      />
      {children}
      <QuoteFooter isDark={isDark} data={data} onChange={onChange} headerInfo={headerInfo} totals={totals} defaultLegalText={defaultLegalText} />
    </div>
  );
};
