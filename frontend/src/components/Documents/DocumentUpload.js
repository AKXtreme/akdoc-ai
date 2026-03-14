import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { uploadDocument } from '../../store/documentSlice';
import { UploadCloud, FileText, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentUpload() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [files, setFiles] = useState([]); // [{ file, status: 'pending'|'uploading'|'done'|'error', error, id }]
  const [docType, setDocType] = useState('invoice');
  const [dropError, setDropError] = useState('');
  const [started, setStarted] = useState(false);

  const onDrop = useCallback((accepted, rejected) => {
    setDropError('');
    if (rejected.length > 0) {
      setDropError(rejected[0]?.errors?.[0]?.message || 'Some files were rejected');
    }
    setFiles((prev) => {
      const existing = new Set(prev.map((e) => e.file.name + e.file.size));
      const newEntries = accepted
        .filter((f) => !existing.has(f.name + f.size))
        .map((f) => ({ file: f, status: 'pending', error: null, id: null }));
      return [...prev, ...newEntries];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    onDropRejected: (r) => setDropError(r[0]?.errors?.[0]?.message || 'File rejected'),
  });

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUploadAll = async () => {
    const hasPending = files.some((f) => f.status === 'pending');
    if (!hasPending) return;
    setStarted(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

      const formData = new FormData();
      formData.append('file', files[i].file);
      formData.append('document_type', docType);
      const result = await dispatch(uploadDocument(formData));

      if (result.error) {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: result.payload || 'Upload failed' } : f));
      } else {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'done', id: result.payload.id } : f));
      }
    }
  };

  const allDone = files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'error');
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const uploadingNow = files.some((f) => f.status === 'uploading');

  const rowBg = (status) => {
    if (status === 'done') return '#f0fdf4';
    if (status === 'error') return '#fef2f2';
    if (status === 'uploading') return 'var(--accent-bg)';
    return 'var(--bg-surface)';
  };

  const statusIcon = (f) => {
    if (f.status === 'uploading') return <Loader size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />;
    if (f.status === 'done') return <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />;
    if (f.status === 'error') return <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />;
    return <FileText size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />;
  };

  return (
    <div style={{ maxWidth: 680, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 4 }}>Upload Documents</h1>
        {!isMobile && <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Upload one or more files for AI-powered data extraction.</p>}
      </div>

      {/* Drop zone */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: isMobile ? 16 : 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16 }}>
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10,
            padding: isMobile ? '24px 16px' : '36px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragActive ? 'var(--accent-bg)' : 'var(--bg-subtle)',
            transition: 'all 0.15s',
          }}
        >
          <input {...getInputProps()} />
          <div style={{
            width: 52, height: 52, borderRadius: 10,
            background: isDragActive ? 'var(--accent-bg)' : 'var(--bg-page)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <UploadCloud size={24} color={isDragActive ? 'var(--accent)' : 'var(--text-muted)'} />
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>
            {isDragActive ? 'Drop files here' : 'Drag & drop or click to select'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, JPG, PNG — max 10 MB each · multiple files supported</div>
        </div>
        {dropError && (
          <div style={{ marginTop: 10, padding: '9px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#dc2626', border: '1px solid #fca5a5' }}>
            {dropError}
          </div>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {files.length} file{files.length !== 1 ? 's' : ''}
              {started && !allDone && <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> — uploading...</span>}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {allDone && (
                <span style={{ fontSize: 12, fontWeight: 600, color: doneCount === files.length ? '#16a34a' : '#d97706' }}>
                  {doneCount} uploaded{errorCount > 0 ? `, ${errorCount} failed` : ''}
                </span>
              )}
              {!started && (
                <button onClick={() => setFiles([])} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          {files.map((entry, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: 12,
                padding: '11px 20px',
                background: rowBg(entry.status),
                borderBottom: idx < files.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.2s',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                {statusIcon(entry)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.file.name}
                  </div>
                  {entry.status === 'error' && (
                    <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{entry.error}</div>
                  )}
                  {entry.status === 'done' && (
                    <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>Uploaded successfully</div>
                  )}
                  {isMobile && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatBytes(entry.file.size)}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {!isMobile && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatBytes(entry.file.size)}
                  </span>
                )}
                {entry.status === 'done' && entry.id && (
                  <button
                    onClick={() => navigate(`/documents/${entry.id}`)}
                    style={{
                      padding: '4px 10px', background: 'var(--accent-bg)', color: 'var(--accent)',
                      border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  >
                    View
                  </button>
                )}
                {entry.status === 'pending' && !started && (
                  <button
                    onClick={() => removeFile(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document type */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Document Type
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={started}
          style={{
            width: '100%', padding: '10px 14px',
            border: '1.5px solid var(--border)', borderRadius: 8,
            fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-surface)',
            outline: 'none', cursor: started ? 'not-allowed' : 'pointer',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <option value="invoice">Invoice</option>
          <option value="receipt">Receipt</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        {!allDone ? (
          <button
            onClick={handleUploadAll}
            disabled={pendingCount === 0 || uploadingNow}
            style={{
              flex: 1, padding: '13px',
              background: (pendingCount === 0 || uploadingNow) ? '#a5b4fc' : 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 600,
              cursor: (pendingCount === 0 || uploadingNow) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            onMouseEnter={(e) => { if (pendingCount > 0 && !uploadingNow) e.currentTarget.style.background = '#4338ca'; }}
            onMouseLeave={(e) => { if (pendingCount > 0 && !uploadingNow) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            <UploadCloud size={16} />
            {uploadingNow
              ? `Uploading ${doneCount + 1} of ${files.length}...`
              : files.length === 0
              ? 'Upload & Process'
              : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''} & Process`}
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate('/documents')}
              style={{
                flex: 1, padding: '13px',
                background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              View All Documents
            </button>
            <button
              onClick={() => { setFiles([]); setStarted(false); setDropError(''); }}
              style={{
                padding: '13px 22px',
                background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              {isMobile ? 'More' : 'Upload More'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
