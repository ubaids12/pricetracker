export default function ProductSearchBar({ onSearch, busy }) {
  return (
    <form className="search-bar" onSubmit={(event) => { event.preventDefault(); onSearch(event.currentTarget.query.value); }}>
      <label htmlFor="product-search">Product URL or name</label>
      <div className="search-row">
        <input id="product-search" name="query" placeholder="Search the catalog" />
        <button type="submit" disabled={busy}>{busy ? 'Searching...' : 'Search'}</button>
      </div>
    </form>
  );
}
