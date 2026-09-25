export default function OptionSelector({ options = [], value, onChange }) {
  return <label>Option<select value={value || ''} onChange={(event) => onChange?.(event.target.value)}><option value="">Choose an option</option>{options.map((option) => <option key={option.id || option.value} value={option.id || option.value}>{option.name || option.value}</option>)}</select></label>;
}
