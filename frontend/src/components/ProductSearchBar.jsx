export default function ProductSearchBar() {
  return (
    <form className="search-bar">
      <label htmlFor="product-search">Product URL or name</label>
      <div className="search-row">
        <input id="product-search" name="query" placeholder="Search the catalog" />
        <button type="submit">Search</button>
      </div>
    </form>
  );
}
