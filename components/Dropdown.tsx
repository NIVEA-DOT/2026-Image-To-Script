
import React from 'react';

interface DropdownOption<T> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'value' | 'onChange'> {
  label: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void; // Value is now strictly T
  name: string;
  className?: string; // Add className prop here
}

const Dropdown = <T extends string>({
  label,
  options,
  value,
  onChange,
  name,
  className = '',
  ...props
}: DropdownProps<T>): React.ReactElement => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as T);
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        {...props}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;