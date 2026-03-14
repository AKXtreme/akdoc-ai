import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDocuments, deleteDocument, silentFetchDocuments } from '../../store/documentSlice';
import { formatDate, formatCurrency, statusColor, statusBg } from '../../utils/helpers';
import { Search, Upload, FileText, ChevronLeft, ChevronRight, Trash2, Download, SlidersHorizontal, X, ChevronUp, ChevronDown, ChevronsUpDown, Tag } from 'lucide-react';
import api from '../../services/api';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const TAG_COLORS = {
  urgent: { bg: '#fee2e2', color: '#dc2626' },
  important: { bg: '#fef3c7', color: '#d97706' },
  approved: { bg: '#dcfce7', color: '#16a34a' },
  reviewed: { bg: '#dbeafe', color: '#2563eb' },
  archived: { bg: '#f1f5f9', color: '#64748b' },
};
const defaultTagColor = { bg: '#ede9fe', color: '#7c3aed' };
const getTagColor = (tag) => TAG_COLORS[tag] || defaultTagColor;

export default function DocumentList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { list, total, loading } = useSelector((s) => s.documents);
  const [filters, setFilters] = useState({ search: '', company: '', status: '', tag: '', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', sortBy: 'upload_date', sortOrder: 'desc', page: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const searchInputRef = useRef(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/documents/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documents_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleExportXlsx = async () => {
    setExportingXlsx(true);
    try {
      const res = await api.get('/documents/export/xlsx', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documents_export.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingXlsx(false);
    }
  };

  const allSelected = list.length > 0 && selected.length === list.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(allSelected ? [] : list.map((d) => d.id));
  };

  const toggleOne = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(id);
    await dispatch(deleteDocument(id));
    setDeleting(null);
    setSelected((prev) => prev.filter((x) => x !== id));
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} selected document${selected.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    for (const id of selected) {
      await dispatch(deleteDocument(id));
    }
    setSelected([]);
    setBulkDeleting(false);
  };

  const buildParams = (f) => {
    const p = { page: f.page };
    if (f.search) p.search = f.search;
    if (f.company) p.company = f.company;
    if (f.status) p.status = f.status;
    if (f.tag) p.tag = f.tag;
    if (f.dateFrom) p.date_from = f.dateFrom;
    if (f.dateTo) p.date_to = f.dateTo;
    if (f.minAmount !== '') p.min_amount = f.minAmount;
    if (f.maxAmount !== '') p.max_amount = f.maxAmount;
    if (f.sortBy) p.sort_by = f.sortBy;
    if (f.sortOrder) p.sort_order = f.sortOrder;
    return p;
  };

  const handleSort = (col) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: col,
      sortOrder: prev.sortBy === col && prev.sortOrder === 'asc' ? 'desc' : prev.sortBy === col ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const SortIcon = ({ col }) => {
    if (filters.sortBy !== col) return <ChevronsUpDown size={12} color="var(--border-strong)" />;
    return filters.sortOrder === 'asc' ? <ChevronUp size={12} color="var(--accent)" /> : <ChevronDown size={12} color="var(--accent)" />;
  };

  const hasAdvancedFilters = filters.dateFrom || filters.dateTo || filters.minAmount !== '' || filters.maxAmount !== '';

  const clearAdvanced = () => setFilters({ ...filters, dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', page: 1 });

  // Debounce search input — wait 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    dispatch(fetchDocuments(buildParams(filters)));
  }, [filters, dispatch]);

  // Clear selection when list changes
  useEffect(() => { setSelected([]); }, [list]);

  // Poll every 5s if any document is pending/processing
  useEffect(() => {
    const hasActive = list.some((d) => d.status === 'pending' || d.status === 'processing');
    if (!hasActive) return;
    const params = buildParams(filters);
    const interval = setInterval(() => dispatch(silentFetchDocuments(params)), 5000);
    return () => clearInterval(interval);
  }, [list, filters, dispatch]);

  // Focus search input when shortcut:focus-search is fired
  useEffect(() => {
    const handler = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    };
    window.addEventListener('shortcut:focus-search', handler);
    return () => window.removeEventListener('shortcut:focus-search', handler);
  }, []);

  const StatusBadge = ({ status }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      color: statusColor(status),
      background: statusBg(status),
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {(status === 'pending' || status === 'processing') && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
      )}
      {status.replace('_', ' ')}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </span>
  );

  const inputStyle = {
    flex: 1,
    minWidth: 160,
    padding: '9px 12px',
    border: '1.5px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    background: 'var(--bg-surface)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 4 }}>Documents</h1>
          {!isMobile && <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>{total} total document{total !== 1 ? 's' : ''}</p>}
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 8 : 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {selected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: isMobile ? '8px 12px' : '10px 18px',
                background: bulkDeleting ? '#fca5a5' : '#dc2626', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: isMobile ? 12 : 14, fontWeight: 600,
                cursor: bulkDeleting ? 'not-allowed' : 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
              onMouseEnter={(e) => { if (!bulkDeleting) e.currentTarget.style.background = '#b91c1c'; }}
              onMouseLeave={(e) => { if (!bulkDeleting) e.currentTarget.style.background = '#dc2626'; }}
            >
              <Trash2 size={15} />
              {isMobile ? `Delete ${selected.length}` : (bulkDeleting ? 'Deleting...' : `Delete ${selected.length} selected`)}
            </button>
          )}
          {/* Export dropdown group */}
          <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 8, overflow: 'hidden', opacity: total === 0 ? 0.5 : 1 }}>
            <button
              onClick={handleExport}
              disabled={exporting || total === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '8px 10px' : '10px 14px',
                background: 'var(--bg-surface)', color: 'var(--text-primary)',
                border: 'none', borderRight: '1px solid var(--border)',
                fontSize: 13, fontWeight: 600,
                cursor: (exporting || total === 0) ? 'not-allowed' : 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
              onMouseEnter={(e) => { if (!exporting && total > 0) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
              title="Export as CSV"
            >
              <Download size={14} />
              {!isMobile && (exporting ? 'Exporting...' : 'CSV')}
            </button>
            <button
              onClick={handleExportXlsx}
              disabled={exportingXlsx || total === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '8px 10px' : '10px 14px',
                background: 'var(--bg-surface)', color: '#16a34a',
                border: 'none',
                fontSize: 13, fontWeight: 600,
                cursor: (exportingXlsx || total === 0) ? 'not-allowed' : 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
              onMouseEnter={(e) => { if (!exportingXlsx && total > 0) e.currentTarget.style.background = '#f0fdf4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
              title="Export as Excel"
            >
              <Download size={14} />
              {!isMobile && (exportingXlsx ? 'Exporting...' : 'Excel')}
            </button>
          </div>
          <button
            onClick={() => navigate('/documents/upload')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: isMobile ? '8px 14px' : '10px 20px',
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 8,
              fontSize: isMobile ? 13 : 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#4338ca'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            <Upload size={15} />
            Upload
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      }}>
        {/* Basic filters row */}
        <div style={{
          display: 'flex',
          gap: isMobile ? 8 : 12,
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          alignItems: isMobile ? 'stretch' : 'center',
        }}>
          <div style={{ position: 'relative', flex: 2, minWidth: isMobile ? 0 : 220 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              ref={searchInputRef}
              placeholder="Search filename, company, invoice #..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 32, minWidth: 0, width: '100%' }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setFilters((prev) => ({ ...prev, search: '', page: 1 })); }}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
          {!isMobile && (
            <input
              placeholder="Filter by company..."
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value, page: 1 })}
              style={inputStyle}
            />
          )}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            style={{
              padding: '9px 12px',
              border: '1.5px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              minWidth: isMobile ? 0 : 150,
              color: 'var(--text-primary)',
              background: 'var(--bg-surface)',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          {!isMobile && (
            <div style={{ position: 'relative', minWidth: 140 }}>
              <Tag size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                placeholder="Filter by tag..."
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value.toLowerCase(), page: 1 })}
                style={{ ...inputStyle, paddingLeft: 30, minWidth: 0, width: '100%' }}
              />
              {filters.tag && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, tag: '', page: 1 }))}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px',
              background: showAdvanced || hasAdvancedFilters ? 'var(--accent-bg)' : 'var(--bg-subtle)',
              color: showAdvanced || hasAdvancedFilters ? 'var(--accent)' : 'var(--text-secondary)',
              border: `1.5px solid ${showAdvanced || hasAdvancedFilters ? 'var(--accent-border)' : 'var(--border)'}`,
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            <SlidersHorizontal size={14} />
            Filters{hasAdvancedFilters ? ' •' : ''}
          </button>
        </div>

        {/* Advanced filters row */}
        {showAdvanced && (
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
            alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
                style={{ ...inputStyle, flex: 'none', minWidth: 0, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
                style={{ ...inputStyle, flex: 'none', minWidth: 0, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value, page: 1 })}
                style={{ ...inputStyle, flex: 'none', minWidth: 0, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Any"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value, page: 1 })}
                style={{ ...inputStyle, flex: 'none', minWidth: 0, width: '100%' }}
              />
            </div>
            {hasAdvancedFilters && (
              <button
                onClick={clearAdvanced}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '9px 12px', alignSelf: 'flex-end',
                  background: 'none', border: '1.5px solid var(--border)', borderRadius: 8,
                  fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table card */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading documents...</div>
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <FileText size={24} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>No documents found</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your filters or upload a new document.</p>
          </div>
        ) : (
          <>
            {/* Selection bar */}
            {selected.length > 0 && (
              <div style={{
                padding: '10px 20px',
                background: 'var(--accent-bg)',
                borderBottom: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 13, color: 'var(--accent)', fontWeight: 600,
              }}>
                <span>{selected.length} of {list.length} selected</span>
                <button
                  onClick={() => setSelected([])}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Clear selection
                </button>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '11px 16px', width: 40 }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleAll}
                        style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--accent)' }}
                      />
                    </th>
                    {[
                      { label: 'Filename', col: 'original_filename' },
                      { label: 'Company', col: 'company_name' },
                      { label: 'Invoice #', col: null },
                      { label: 'Amount', col: 'total_amount' },
                      { label: 'Date', col: 'upload_date' },
                      { label: 'Status', col: 'status' },
                      { label: 'Tags', col: null },
                      { label: 'Actions', col: null },
                    ].map(({ label, col }) => (
                      <th
                        key={label}
                        onClick={col ? () => handleSort(col) : undefined}
                        style={{
                          padding: '11px 16px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 700,
                          color: col && filters.sortBy === col ? 'var(--accent)' : 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                          cursor: col ? 'pointer' : 'default',
                          userSelect: 'none',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {label}
                          {col && <SortIcon col={col} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((doc, idx) => {
                    const isSelected = selected.includes(doc.id);
                    return (
                      <tr
                        key={doc.id}
                        style={{
                          borderBottom: idx < list.length - 1 ? '1px solid var(--border)' : 'none',
                          background: isSelected ? 'var(--accent-bg)' : '',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'var(--accent-bg)' : ''; }}
                      >
                        <td style={{ padding: '13px 16px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(doc.id)}
                            style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--accent)' }}
                          />
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            {doc.original_filename}
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-primary)' }}>
                          {doc.extraction?.corrected_company_name || doc.extraction?.company_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-primary)' }}>
                          {doc.extraction?.corrected_invoice_number || doc.extraction?.invoice_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(doc.extraction?.corrected_total_amount ?? doc.extraction?.total_amount)}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(doc.upload_date)}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <StatusBadge status={doc.status} />
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 160 }}>
                            {(doc.tags || []).slice(0, 3).map((tag) => {
                              const { bg, color } = getTagColor(tag);
                              return (
                                <span key={tag} style={{
                                  padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                                  background: bg, color, whiteSpace: 'nowrap',
                                }}>{tag}</span>
                              );
                            })}
                            {(doc.tags || []).length > 3 && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>+{doc.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => navigate(`/documents/${doc.id}`)}
                              style={{
                                padding: '5px 12px',
                                background: 'var(--accent-bg)', color: 'var(--accent)',
                                border: 'none', borderRadius: 6,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#e0e7ff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleting === doc.id}
                              style={{
                                padding: '5px 12px',
                                background: '#fee2e2', color: '#dc2626',
                                border: 'none', borderRadius: 6,
                                fontSize: 12, fontWeight: 600,
                                cursor: deleting === doc.id ? 'not-allowed' : 'pointer',
                                opacity: deleting === doc.id ? 0.5 : 1,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                              }}
                              onMouseEnter={(e) => { if (deleting !== doc.id) e.currentTarget.style.background = '#fecaca'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                            >
                              {deleting === doc.id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{
            padding: '12px 20px',
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'flex-end',
            alignItems: 'center',
            gap: 8,
            borderTop: '1px solid var(--border)',
          }}>
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid var(--border)',
                cursor: filters.page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: 13, background: 'var(--bg-surface)', color: 'var(--text-primary)',
                opacity: filters.page <= 1 ? 0.5 : 1,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Page {filters.page}
            </span>
            <button
              disabled={list.length < 20}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid var(--border)',
                cursor: list.length < 20 ? 'not-allowed' : 'pointer',
                fontSize: 13, background: 'var(--bg-surface)', color: 'var(--text-primary)',
                opacity: list.length < 20 ? 0.5 : 1,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
