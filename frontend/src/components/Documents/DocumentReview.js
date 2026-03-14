import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { reviewDocument } from '../../store/documentSlice';
import { toast } from 'react-toastify';
import { Check, Edit3 } from 'lucide-react';

export default function DocumentReview({ document: doc }) {
  const dispatch = useDispatch();
  const ext = doc.extraction;
  const [form, setForm] = useState({
    corrected_invoice_number: ext?.corrected_invoice_number || ext?.invoice_number || '',
    corrected_company_name: ext?.corrected_company_name || ext?.company_name || '',
    corrected_invoice_date: ext?.corrected_invoice_date || ext?.invoice_date || '',
    corrected_total_amount: ext?.corrected_total_amount ?? ext?.total_amount ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, corrected_total_amount: form.corrected_total_amount ? parseFloat(form.corrected_total_amount) : null };
    await dispatch(reviewDocument({ id: doc.id, corrections: payload }));
    setSaving(false);
    toast.success('Corrections saved!');
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '10px 12px',
    border: `1.5px solid ${focusedField === field ? '#4f46e5' : '#e2e8f0'}`,
    borderRadius: 8,
    fontSize: 13,
    boxSizing: 'border-box',
    outline: 'none',
    color: '#0f172a',
    background: '#fff',
    transition: 'border-color 0.15s',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  });

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#eef2ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Edit3 size={15} color="#4f46e5" />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Human Review</h3>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 22, marginTop: 4, marginLeft: 42 }}>
        Correct any extraction errors below and save your changes.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Invoice Number</label>
          <input
            style={inputStyle('invoiceNumber')}
            value={form.corrected_invoice_number}
            onChange={(e) => setForm({ ...form, corrected_invoice_number: e.target.value })}
            onFocus={() => setFocusedField('invoiceNumber')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        <div>
          <label style={labelStyle}>Company Name</label>
          <input
            style={inputStyle('companyName')}
            value={form.corrected_company_name}
            onChange={(e) => setForm({ ...form, corrected_company_name: e.target.value })}
            onFocus={() => setFocusedField('companyName')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        <div>
          <label style={labelStyle}>Invoice Date</label>
          <input
            style={inputStyle('invoiceDate')}
            value={form.corrected_invoice_date}
            onChange={(e) => setForm({ ...form, corrected_invoice_date: e.target.value })}
            onFocus={() => setFocusedField('invoiceDate')}
            onBlur={() => setFocusedField(null)}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div>
          <label style={labelStyle}>Total Amount</label>
          <input
            style={inputStyle('totalAmount')}
            type="number"
            step="0.01"
            value={form.corrected_total_amount}
            onChange={(e) => setForm({ ...form, corrected_total_amount: e.target.value })}
            onFocus={() => setFocusedField('totalAmount')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
      </div>

      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 22px',
            background: saving ? '#a5b4fc' : '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#4338ca'; }}
          onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = '#4f46e5'; }}
        >
          <Check size={15} />
          {saving ? 'Saving...' : 'Save Corrections'}
        </button>
      </div>
    </div>
  );
}
