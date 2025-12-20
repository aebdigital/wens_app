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
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  className
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
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="custom-datepicker-wrapper w-full relative">
      <style>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container {
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
          height: 100%;
          padding-right: 28px !important;
        }
        .react-datepicker {
          font-family: inherit;
          border-color: ${isDark ? '#4b5563' : '#d1d5db'};
          background-color: ${isDark ? '#1f2937' : '#ffffff'};
          color: ${isDark ? '#f3f4f6' : '#1f2937'};
        }
        .react-datepicker__header {
          background-color: ${isDark ? '#374151' : '#f0f0f0'};
          border-bottom-color: ${isDark ? '#4b5563' : '#d1d5db'};
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: ${isDark ? '#f3f4f6' : '#1f2937'};
        }
        .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
          color: ${isDark ? '#d1d5db' : '#1f2937'};
        }
        .react-datepicker__day:hover, .react-datepicker__month-text:hover, .react-datepicker__quarter-text:hover, .react-datepicker__year-text:hover {
          background-color: ${isDark ? '#4b5563' : '#f0f0f0'};
        }
        .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range, .react-datepicker__month-text--selected, .react-datepicker__month-text--in-selecting-range, .react-datepicker__month-text--in-range, .react-datepicker__quarter-text--selected, .react-datepicker__quarter-text--in-selecting-range, .react-datepicker__quarter-text--in-range, .react-datepicker__year-text--selected, .react-datepicker__year-text--in-selecting-range, .react-datepicker__year-text--in-range {
          background-color: #e11b28;
          color: #fff;
        }
        .react-datepicker__day--keyboard-selected, .react-datepicker__month-text--keyboard-selected, .react-datepicker__quarter-text--keyboard-selected, .react-datepicker__year-text--keyboard-selected {
          background-color: #b8141f;
          color: #fff;
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
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <CalendarIcon />
      </div>
    </div>
  );
};
