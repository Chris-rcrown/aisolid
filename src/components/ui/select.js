import React from "react";

const Select = ({ options, value, onChange, className }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none ${className}`}
    >
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
