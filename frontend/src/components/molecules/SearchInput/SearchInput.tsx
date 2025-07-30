import React from "react";
import Icon from "../../atoms/Icons/Icons";
import { IconButton } from "../../atoms/IconButton/IconButton";
import './searchInput.scss'

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = ""
}: SearchInputProps) {
  return (
    <div className={`search-input ${className}`}>
      <input
        id="search"
        className="search-input__input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="search-input__icon">
        <Icon icon={'search'} ariaHidden={true} name={'Search'}/>
      </span>
      {value && (
        <IconButton
          onClick={() => onChange('')}
          icon={'cross'}
          title={'Clear search'}
          smaller={true}
        />
      )}
    </div>
  );
}