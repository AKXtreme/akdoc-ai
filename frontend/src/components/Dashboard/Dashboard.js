import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Upload, FileText, ArrowRight, Clock, Building2 } from 'lucide-react';
import { fetchAnalytics } from '../../store/documentSlice';
import AnalyticsCards from './AnalyticsCards';
import { formatCurrency, formatDate, statusColor, statusBg } from '../../utils/helpers';
import api from '../../services/api';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CustomTooltipBar = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--accent)' }}>{payload[0].value} documents</div>
      </div>
    );
  }
  return null;
};

const CustomTooltipLine = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#7c3aed' }}>{formatCurrency(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { analytics, loading } = useSelector((s) => s.documents);
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [vendors, setVendors] = useState([]);

  useEffect(() => { dispatch(fetchAnalytics()); }, [dispatch]);

  useEffect(() => {
    api.get('/analytics/vendors').then((res) => setVendors(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/documents/', { params: { page: 1, page_size: 6 } })
      .then((res) => setRecent(res.data.documents))
      .finally(() => setRecentLoading(false));
  }, []);

  // Poll recent docs while any are still processing
  useEffect(() => {
    const hasActive = recent.some((d) => d.status === 'pending' || d.status === 'processing');
    if (!hasActive) return;
    const interval = setInterval(() => {
      api.get('/documents/', { params: { page: 1, page_size: 6 } })
        .then((res) => setRecent(res.data.documents));
    }, 5000);
    return () => clearInterval(interval);
  }, [recent]);

  const chartData = analytics?.trends?.map((t) => ({
    name: `${MONTH_NAMES[t.month]} ${t.year}`,
    documents: t.document_count,
    amount: t.total_amount,
  })) || [];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* Page header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        marginBottom: 28,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 4 }}>Dashboard</h1>
          {!isMobile && <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Document processing overview</p>}
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
            alignSelf: isMobile ? 'flex-start' : 'auto',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#4338ca'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          <Upload size={15} />
          {isMobile ? 'Upload' : 'Upload Document'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
          Loading analytics...
        </div>
      )}

      <AnalyticsCards summary={analytics?.summary} />

      {/* Charts */}
      {chartData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '24px 24px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: 2 }}>Monthly Documents</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Document uploads per month</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Bar dataKey="documents" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '24px 24px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: 2 }}>Monthly Invoice Amounts</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Total invoice value per month</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltipLine />} />
                <Line type="monotone" dataKey="amount" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vendor Analytics */}
      {vendors.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Horizontal bar chart */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '24px 24px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: 2 }}>Top Vendors by Invoices</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Total invoice value per company</p>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(vendors.slice(0, 7).length * 36 + 20, 160)}>
              <BarChart data={vendors.slice(0, 7)} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <YAxis type="category" dataKey="company" tick={{ fontSize: 11, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip
                  content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{payload[0].payload.company}</div>
                      <div style={{ color: '#7c3aed' }}>{formatCurrency(payload[0].value)}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{payload[0].payload.document_count} invoice{payload[0].payload.document_count !== 1 ? 's' : ''}</div>
                    </div>
                  ) : null}
                />
                <Bar dataKey="total_amount" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Vendor table */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={15} color="var(--text-secondary)" />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Vendor Summary</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    {['Company', 'Invoices', 'Total', 'Avg'].map((h) => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: h === 'Company' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendors.slice(0, 8).map((v, idx) => (
                    <tr key={v.company} style={{ borderBottom: idx < Math.min(vendors.length, 8) - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                            background: `hsl(${(v.company.charCodeAt(0) * 37) % 360}, 60%, 92%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                            color: `hsl(${(v.company.charCodeAt(0) * 37) % 360}, 60%, 35%)`,
                          }}>
                            {v.company.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.company}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 7px', borderRadius: 10, fontWeight: 600, fontSize: 11 }}>
                          {v.document_count}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                        {formatCurrency(v.total_amount)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(v.avg_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Documents */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} color="var(--text-secondary)" />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Documents</h3>
          </div>
          <button
            onClick={() => navigate('/documents')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--accent)', fontWeight: 600,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            View all <ArrowRight size={13} />
          </button>
        </div>

        {recentLoading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <FileText size={22} color="var(--accent)" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>No documents yet</p>
            <button
              onClick={() => navigate('/documents/upload')}
              style={{
                padding: '8px 18px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              Upload your first document
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  {['Filename', 'Company', 'Amount', 'Status', 'Uploaded', ''].map((h) => (
                    <th key={h} style={{
                      padding: '9px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    style={{ borderBottom: idx < recent.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s', cursor: 'pointer' }}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.original_filename}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)' }}>
                      {doc.extraction?.corrected_company_name || doc.extraction?.company_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(doc.extraction?.corrected_total_amount ?? doc.extraction?.total_amount)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        color: statusColor(doc.status), background: statusBg(doc.status),
                        textTransform: 'capitalize',
                      }}>
                        {(doc.status === 'pending' || doc.status === 'processing') && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
                        )}
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(doc.upload_date)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <ArrowRight size={14} color="var(--text-muted)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
