import { exportUrl } from '../api/client';

export default function ExportButton({ productId }) {
  return <a className="export-button" href={exportUrl(productId)} download>Export CSV ↓</a>;
}
