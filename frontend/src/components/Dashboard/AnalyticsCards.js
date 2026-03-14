import React from 'react';
import { FileText, CheckCircle, Clock, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const CARDS = [
  {
    key: 'total_documents',
    title: 'Total Documents',
    icon: FileText,
    borderColor: '#4f46e5',
    iconBg: '#eef2ff',
    iconColor: '#4f46e5',
    getValue: (s) => s.total_documents,
  },
  {
    key: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    borderColor: '#16a34a',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    getValue: (s) => s.completed,
  },
  {
    key: 'processing',
    title: 'In Progress',
    icon: Clock,
    borderColor: '#d97706',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    getValue: (s) => (s.processing || 0) + (s.pending || 0),
  },
  {
    key: 'failed',
    title: 'Failed',
    icon: XCircle,
    borderColor: '#dc2626',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    getValue: (s) => s.failed,
  },
  {
    key: 'total_invoice_amount',
    title: 'Total Invoice Amount',
    icon: DollarSign,
    borderColor: '#7c3aed',
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    getValue: (s) => formatCurrency(s.total_invoice_amount),
  },
  {
    key: 'success_rate',
    title: 'Success Rate',
    icon: TrendingUp,
    borderColor: '#0891b2',
    iconBg: '#e0f2fe',
    iconColor: '#0891b2',
    getValue: (s) => `${s.success_rate}%`,
  },
];

export default function AnalyticsCards({ summary }) {
  if (!summary) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16,
      marginBottom: 28,
    }}>
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 12,
              padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${card.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.title}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {card.getValue(summary)}
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: card.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={20} color={card.iconColor} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
