import PriceHistoryChart from '../components/PriceHistoryChart';
import ScrapeLogTable from '../components/ScrapeLogTable';
import ExportButton from '../components/ExportButton';

export default function ProductDetail() {
  return <section><h2>Product detail</h2><PriceHistoryChart /><ScrapeLogTable /><ExportButton /></section>;
}
