import Select from 'react-select';

import './ExtendedSelect.css';

export interface ExtendedSelectProps<Option> {
  options: Option[];
  value: Option;
  onChange: (option: Option) => void;
  getOptionLabel?: (option: Option) => string;
  getOptionValue?: (option: Option) => string;
  isSearchable?: boolean;
  maxMenuHeight?: number;
}
function ExtendedSelect<Option>(props: ExtendedSelectProps<Option>) {
  const {
    options,
    value,
    onChange,
    getOptionLabel,
    getOptionValue,
    isSearchable,
    maxMenuHeight,
  } = props;

  return (
    <Select
      className="ExtendedSelect"
      options={options}
      value={value}
      onChange={onChange}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      isSearchable={isSearchable}
      maxMenuHeight={maxMenuHeight}
      unstyled
      classNamePrefix="ExtendedSelect"
    />
  );
}

ExtendedSelect.defaultProps = {
  isSearchable: false,
  getOptionLabel: (o) => String(o),
  getOptionValue: (o) => String(o),
  maxMenuHeight: 130,
};

export default ExtendedSelect;
