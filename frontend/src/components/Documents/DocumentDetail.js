import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDocumentById, clearCurrent, silentFetchDocumentById, updateTags } from '../../store/documentSlice';
import { formatDate, formatCurrency, statusColor, statusBg } from '../../utils/helpers';
import DocumentReview from './DocumentReview';
import { ArrowLeft, FileText, AlertCircle, RefreshCw, Eye, EyeOff, Tag, X, Plus, Upload, Cpu, CheckCircle, XCircle, Edit3, RotateCcw, Clock } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const AUDIT_CONFIG = {
  uploaded:              { label: 'Document uploaded',      Icon: Upload,     color: '#4f46e5', bg: '#eef2ff' },
  processing_started:    { label: 'Processing started',     Icon: Cpu,        color: '#0891b2', bg: '#e0f2fe' },
  processing_completed:  { label: 'Processing completed',   Icon: CheckCircle,color: '#16a34a', bg: '#dcfce7' },
  processing_failed:     { label: 'Processing failed',      Icon: XCircle,    color: '#dc2626', bg: '#fee2e2' },
  reviewed:              { label: 'Review submitted',        Icon: Edit3,      color: '#7c3aed', bg: '#ede9fe' },
  reprocessed:           { label: 'Reprocess requested',    Icon: RotateCcw,  color: '#d97706', bg: '#fef3c7' },
  tags_updated:          { label: 'Tags updated',           Icon: Tag,        color: '#2563eb', bg: '#dbeafe' },
};

const TAG_SUGGESTIONS = ['urgent', 'reviewed', 'archived', 'important', 'pending-review', 'approved'];

const TAG_COLORS = {
  urgent: { bg: '#fee2e2', color: '#dc2626' },
  important: { bg: '#fef3c7', color: '#d97706' },
  approved: { bg: '#dcfce7', color: '#16a34a' },
  reviewed: { bg: '#dbeafe', color: '#2563eb' },
  archived: { bg: '#f1f5f9', color: '#64748b' },
};
const defaultTagColor = { bg: '#ede9fe', color: '#7c3aed' };
const getTagColor = (tag) => TAG_COLORS[tag] || defaultTagColor;

const BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

function PdfPreview({ docId, isMobile }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let objectUrl;
    api.get(`/documents/${docId}/file`, { responseType: 'blob' })
      .then((res) => {
        objectUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [docId]);
  if (!url) return <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Loading preview...</div>;
  return <iframe src={url} title="PDF Preview" style={{ width: '100%', height: isMobile ? 400 : 640, border: 'none', borderRadius: 8 }} />;
}

export default function DocumentDetail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { isMobile } = useBreakpoint();
  const { current: doc, loading } = useSelector((s) => s.documents);
  const [reprocessing, setReprocessing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [savingTags, setSavingTags] = useState(false);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    if (!doc || doc.file_type === 'pdf') return;
    if (doc.file_type !== 'jpg' && doc.file_type !== 'jpeg' && doc.file_type !== 'png') return;
    let url;
    api.get(`/documents/${doc.id}/file`, { responseType: 'blob' })
      .then((res) => {
        url = URL.createObjectURL(res.data);
        setPreviewUrl(url);
      })
      .catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [doc?.id, doc?.file_type]);

  const currentTags = doc?.tags || [];

  const saveTags = async (newTags) => {
    setSavingTags(true);
    try {
      await dispatch(updateTags({ id: doc.id, tags: newTags })).unwrap();
      fetchAudit();
    } catch {
      toast.error('Failed to save tags');
    } finally {
      setSavingTags(false);
    }
  };

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase();
    if (!clean || currentTags.includes(clean)) return;
    saveTags([...currentTags, clean]);
    setTagInput('');
  };

  const removeTag = (tag) => saveTags(currentTags.filter((t) => t !== tag));

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await api.post(`/documents/${id}/reprocess`);
      toast.success('Reprocessing started');
      fetchAudit();
      setTimeout(() => dispatch(fetchDocumentById(id)), 1500);
    } catch {
      toast.error('Failed to reprocess document');
    } finally {
      setReprocessing(false);
    }
  };

  useEffect(() => {
    dispatch(fetchDocumentById(id));
    return () => dispatch(clearCurrent());
  }, [id, dispatch]);

  const fetchAudit = () => {
    api.get(`/documents/${id}/audit`).then((res) => setAudit(res.data)).catch(() => {});
  };

  useEffect(() => { fetchAudit(); }, [id]);

  // Poll every 3s while processing/pending; refresh audit when status changes
  useEffect(() => {
    if (!doc) return;
    if (doc.status !== 'pending' && doc.status !== 'processing') return;
    const interval = setInterval(() => {
      dispatch(silentFetchDocumentById(id));
      fetchAudit();
    }, 3000);
    return () => clearInterval(interval);
  }, [doc?.status, id, dispatch]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12, color: 'var(--text-secondary)', fontSize: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)' }} />
      Loading document...
    </div>
  );

  if (!doc) return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      Document not found.
    </div>
  );

  const ext = doc.extraction;

  const InfoRow = ({ label, value }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value || <span style={{ color: 'var(--text-muted)' }}>—</span>}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 920, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/documents')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--bg-surface)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          marginBottom: isMobile ? 16 : 24,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <ArrowLeft size={14} /> Back to Documents
      </button>

      {/* Document header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        padding: isMobile ? '14px 16px' : '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: 10,
            background: 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FileText size={isMobile ? 18 : 22} color="var(--accent)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 6, wordBreak: 'break-word' }}>
              {doc.original_filename}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                color: statusColor(doc.status), background: statusBg(doc.status),
                textTransform: 'capitalize',
              }}>
                {doc.status.replace('_', ' ')}
              </span>
              {(doc.status === 'pending' || doc.status === 'processing') && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#d97706' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #fde68a', borderTopColor: '#d97706', animation: 'spin 0.8s linear infinite' }} />
                  Processing...
                </span>
              )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
        {(doc.status === 'failed' || doc.status === 'completed' || doc.status === 'review_needed') && (
          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 16px',
              background: reprocessing ? 'var(--border)' : 'var(--bg-subtle)',
              color: 'var(--text-primary)', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              cursor: reprocessing ? 'not-allowed' : 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            onMouseEnter={(e) => { if (!reprocessing) e.currentTarget.style.background = 'var(--border)'; }}
            onMouseLeave={(e) => { if (!reprocessing) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
          >
            <RefreshCw size={14} style={{ animation: reprocessing ? 'spin 1s linear infinite' : 'none' }} />
            {reprocessing ? 'Starting...' : 'Reprocess'}
          </button>
        )}
      </div>

      {/* Tags */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Tag size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Tags</span>
          {savingTags && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Saving...</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {currentTags.map((tag) => {
            const { bg, color } = getTagColor(tag);
            return (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20,
                background: bg, color,
                fontSize: 12, fontWeight: 600,
              }}>
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 0, display: 'flex', opacity: 0.7 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; }}
                >
                  <X size={11} />
                </button>
              </span>
            );
          })}
          {/* Tag input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
              placeholder="Add tag..."
              style={{
                padding: '4px 10px', border: '1.5px dashed var(--border-strong)', borderRadius: 20,
                fontSize: 12, outline: 'none', background: 'transparent', color: 'var(--text-primary)',
                width: 100,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            />
            {tagInput && (
              <button
                onClick={() => addTag(tagInput)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--accent)', border: 'none', cursor: 'pointer', color: '#fff',
                }}
              >
                <Plus size={12} />
              </button>
            )}
          </div>
        </div>
        {/* Suggestions */}
        {TAG_SUGGESTIONS.filter((s) => !currentTags.includes(s)).length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Suggestions:</span>
            {TAG_SUGGESTIONS.filter((s) => !currentTags.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addTag(s)}
                style={{
                  padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                  background: 'var(--bg-subtle)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Two-column info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Document Info */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, margin: 0, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Document Info
          </h3>
          <InfoRow label="File Type" value={doc.file_type?.toUpperCase()} />
          <InfoRow label="File Size" value={doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : null} />
          <InfoRow label="Uploaded" value={formatDate(doc.upload_date)} />
          <InfoRow label="Processed" value={formatDate(doc.processed_date)} />
        </div>

        {/* Extracted Data */}
        {ext && (
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Extracted Data
              </h3>
              {ext.is_reviewed && (
                <span style={{
                  background: '#dcfce7', color: '#16a34a',
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                }}>
                  Reviewed
                </span>
              )}
            </div>
            <InfoRow label="Invoice #" value={ext.corrected_invoice_number || ext.invoice_number} />
            <InfoRow label="Company" value={ext.corrected_company_name || ext.company_name} />
            <InfoRow label="Date" value={ext.corrected_invoice_date || ext.invoice_date} />
            <InfoRow label="Amount" value={formatCurrency(ext.corrected_total_amount ?? ext.total_amount)} />
            <InfoRow label="Confidence" value={ext.confidence_score ? `${(ext.confidence_score * 100).toFixed(0)}%` : null} />
          </div>
        )}
      </div>

      {/* Document preview */}
      {(doc.file_type === 'jpg' || doc.file_type === 'jpeg' || doc.file_type === 'png' || doc.file_type === 'pdf') && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          marginBottom: 20,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: showPreview ? '1px solid var(--border)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Document Preview
            </h3>
            <button
              onClick={() => setShowPreview((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              {showPreview ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
            </button>
          </div>
          {showPreview && (
            <div style={{ padding: 16, background: 'var(--bg-subtle)', textAlign: 'center' }}>
              {doc.file_type === 'pdf' ? (
                <PdfPreview docId={doc.id} isMobile={isMobile} />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={doc.original_filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: isMobile ? 400 : 600,
                    borderRadius: 8,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Loading preview...</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OCR text */}
      {doc.ocr_text && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            OCR Text
          </h3>
          <pre style={{
            fontSize: 12,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 220,
            overflowY: 'auto',
            background: 'var(--bg-subtle)',
            padding: '14px 16px',
            borderRadius: 8,
            margin: 0,
            lineHeight: 1.6,
            border: '1px solid var(--border)',
            fontFamily: "'SF Mono', 'Fira Mono', 'Consolas', monospace",
          }}>
            {doc.ocr_text}
          </pre>
        </div>
      )}

      {/* Error message */}
      {doc.error_message && (
        <div style={{
          background: '#fee2e2',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          border: '1px solid #fca5a5',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 600, color: '#dc2626', fontSize: 13, marginBottom: 2 }}>Processing Error</div>
            <div style={{ fontSize: 13, color: '#991b1b' }}>{doc.error_message}</div>
          </div>
        </div>
      )}

      {/* Review form */}
      {doc.status === 'completed' && ext && <DocumentReview document={doc} />}

      {/* Audit Log */}
      {audit.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 12,
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          marginTop: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Clock size={14} color="var(--text-secondary)" />
            <h3 style={{ fontSize: 12, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Activity Log
            </h3>
          </div>
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {audit.map((entry, idx) => {
                const cfg = AUDIT_CONFIG[entry.action] || { label: entry.action, Icon: Clock, color: 'var(--text-secondary)', bg: 'var(--bg-subtle)' };
                const { Icon, label, color, bg } = cfg;
                const isLast = idx === audit.length - 1;
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 14, paddingBottom: isLast ? 0 : 16, position: 'relative' }}>
                    {/* Icon dot */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', background: bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, zIndex: 1, border: '2px solid var(--bg-surface)',
                    }}>
                      <Icon size={13} color={color} />
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, paddingTop: 5, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                          {entry.actor_name && entry.actor_name !== 'system' && (
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}> by <strong>{entry.actor_name}</strong></span>
                          )}
                          {entry.detail && Object.keys(entry.detail).length > 0 && (
                            <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                              {entry.action === 'tags_updated' && entry.detail.tags?.length > 0 && (
                                <span>Tags: {entry.detail.tags.join(', ')}</span>
                              )}
                              {entry.action === 'processing_completed' && entry.detail.company && (
                                <span>{entry.detail.company}{entry.detail.amount != null ? ` · $${entry.detail.amount}` : ''}</span>
                              )}
                              {entry.action === 'processing_failed' && entry.detail.error && (
                                <span style={{ color: '#dc2626' }}>{entry.detail.error.slice(0, 80)}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {new Date(entry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
