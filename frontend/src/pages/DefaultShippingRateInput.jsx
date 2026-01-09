import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';

export default function DefaultShippingRateInput({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value === 0 ? '' : String(value));

  useEffect(() => {
    setInputValue(value === 0 ? '' : String(value));
  }, [value]);

  const handleInputChange = (e) => {
    let val = e.target.value;
    val = val.replace(/^0+(?=\d)/, '');
    if (/^\d*(\.|,)?\d{0,2}$/.test(val)) {
      setInputValue(val);
      const num = parseFloat(val.replace(',', '.'));
      onChange(isNaN(num) ? 0 : num);
    }
  };

  return (
    <Form.Control
      type="text"
      inputMode="decimal"
      value={inputValue}
      onChange={handleInputChange}
      placeholder="0.00"
      autoComplete="off"
    />
  );
}
