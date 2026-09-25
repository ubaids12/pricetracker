export default function ScrapeLogTable({ logs = [] }) {
  return <div className="data-panel"><div className="panel-title"><h3>Scrape attempts</h3><span>{logs.length} attempts</span></div>{logs.length ? <div className="log-list">{logs.map((log) => <div className="log-row" key={log.id}><time>{new Date(log.started_at).toLocaleString()}</time><span>{log.strategy}</span><span className={`status-${log.outcome}`}>{log.outcome}</span><small>{log.error_message || `Attempt ${log.attempt_number}`}</small></div>)}</div> : <p className="empty-state">No scrape attempts yet.</p>}</div>;
}
