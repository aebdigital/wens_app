import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { sk } from 'date-fns/locale/sk';
import { useTheme } from '../../contexts/ThemeContext';

registerLocale('sk', sk);

interface CustomDatePickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean; // For use in table headers with minimal styling
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  compact = false
}) => {
  const { isDark } = useTheme();

  const dateValue = value ? new Date(value) : null;

  const handleChange = (date: Date | null) => {
    if (date) {
      // Format as YYYY-MM-DD
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - (offset*60*1000));
      onChange(adjustedDate.toISOString().split('T')[0]);
    } else {
      onChange('');
    }
  };

  // Calendar icon component for custom input
  const CalendarIcon = () => (
    <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-[#e11b28]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className={`custom-datepicker-wrapper w-full relative ${compact ? 'compact-mode' : ''}`}>
      <style>{`
        /* Wrapper styles */
        .custom-datepicker-wrapper .react-datepicker-wrapper {
          width: 100%;
        }
        .custom-datepicker-wrapper .react-datepicker__input-container {
          width: 100%;
        }
        .custom-datepicker-wrapper .react-datepicker__input-container input {
          width: 100%;
          height: 100%;
        }
        .custom-datepicker-wrapper:not(.compact-mode) .react-datepicker__input-container input {
          padding-right: 28px !important;
        }

        /* Global styles for portal-rendered calendar */
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          border: none !important;
          border-radius: 16px !important;
          background-color: ${isDark ? '#1f2937' : '#ffffff'} !important;
          color: ${isDark ? '#f3f4f6' : '#1f2937'} !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          overflow: hidden !important;
          font-size: 15px !important;
        }
        .react-datepicker__month-container {
          padding: 0 !important;
        }
        .react-datepicker__header {
          background: linear-gradient(135deg, #e11b28 0%, #b8141f 100%) !important;
          border-bottom: none !important;
          border-radius: 0 !important;
          padding: 16px 16px 12px !important;
        }
        .react-datepicker__current-month {
          color: #ffffff !important;
          font-weight: 600 !important;
          font-size: 18px !important;
          margin-bottom: 0 !important;
          text-transform: capitalize !important;
        }
        .react-datepicker__navigation {
          top: 14px !important;
          width: 36px !important;
          height: 36px !important;
        }
        .react-datepicker__navigation--previous {
          left: 12px !important;
        }
        .react-datepicker__navigation--next {
          right: 12px !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #ffffff !important;
          border-width: 3px 3px 0 0 !important;
          width: 12px !important;
          height: 12px !important;
        }
        .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: rgba(255, 255, 255, 0.7) !important;
        }
        .react-datepicker__day-names {
          background-color: ${isDark ? '#1f2937' : '#ffffff'} !important;
          margin-top: 0 !important;
          padding: 12px 12px 0 12px !important;
        }
        .react-datepicker__day-name {
          color: ${isDark ? '#f3f4f6' : '#111827'} !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          width: 44px !important;
          line-height: 44px !important;
          margin: 3px !important;
        }
        .react-datepicker__day-name:nth-child(6),
        .react-datepicker__day-name:nth-child(7) {
          color: ${isDark ? '#f87171' : '#dc2626'} !important;
        }
        .react-datepicker__month {
          margin: 0 !important;
          padding: 0 12px 12px 12px !important;
        }
        .react-datepicker__day {
          color: ${isDark ? '#e5e7eb' : '#374151'} !important;
          width: 44px !important;
          line-height: 44px !important;
          margin: 3px !important;
          border-radius: 10px !important;
          font-size: 15px !important;
          font-weight: 500 !important;
          transition: all 0.15s ease !important;
        }
        .react-datepicker__day:hover {
          background-color: ${isDark ? '#374151' : '#f3f4f6'} !important;
          border-radius: 10px !important;
        }
        .react-datepicker__day--today {
          font-weight: 700 !important;
          background-color: ${isDark ? '#374151' : '#fef2f2'} !important;
          color: #e11b28 !important;
          border: 2px solid #e11b28 !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background: linear-gradient(135deg, #e11b28 0%, #b8141f 100%) !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          border: none !important;
        }
        .react-datepicker__day--selected:hover,
        .react-datepicker__day--in-selecting-range:hover,
        .react-datepicker__day--in-range:hover {
          background: linear-gradient(135deg, #c71325 0%, #9e1019 100%) !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: transparent !important;
          color: inherit !important;
        }
        .react-datepicker__day--keyboard-selected:not(.react-datepicker__day--today):not(.react-datepicker__day--selected) {
          background-color: transparent !important;
        }
        .react-datepicker__day--outside-month {
          color: ${isDark ? '#6b7280' : '#9ca3af'} !important;
        }
        .react-datepicker__day--disabled {
          color: ${isDark ? '#4b5563' : '#d1d5db'} !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
        /* Weekend days styling */
        .react-datepicker__day--weekend {
          color: ${isDark ? '#f87171' : '#dc2626'} !important;
        }
        .react-datepicker__day--weekend.react-datepicker__day--selected {
          color: #ffffff !important;
        }
      `}</style>
      <DatePicker
        selected={dateValue}
        onChange={handleChange}
        dateFormat="dd.MM.yyyy"
        placeholderText={placeholder}
        disabled={disabled}
        className={className}
        locale="sk"
        showPopperArrow={false}
        popperPlacement="bottom-start"
        portalId="root"
      />
      {!compact && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <CalendarIcon />
        </div>
      )}
    </div>
  );
};
