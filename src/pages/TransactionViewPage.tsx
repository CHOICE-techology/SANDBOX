import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChoiceButton } from '@/components/ChoiceButton';
import { ArrowLeft, CheckCircle, Clock, Hash, Award, Shield, Layers, Copy, Check } from 'lucide-react';

interface TxRecord {
  id: string;
  wallet_address: string;
  reputation_hash: string;
  score: number;
  status: string;
  tx_hash: string;
  chain: string;
  created_at: string;
}

const TransactionViewPage: React.FC = () => {
  const { txId } = useParams<{ txId: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<TxRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!txId) return;
    const load = async () => {
      const { data } = await supabase
        .from('verification_transactions')
        .select('*')
        .eq('id', txId)
        .single();
      setTx(data as TxRecord | null);
      setLoading(false);
    };
    load();
  }, [txId]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <Shield size={40} className="text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Transaction Not Found</h1>
        <p className="text-muted-foreground mb-6">This verification record doesn't exist or has been removed.</p>
        <ChoiceButton onClick={() => navigate('/identity')}>Back to Identity</ChoiceButton>
      </div>
    );
  }

  const date = new Date(tx.created_at);
  const rows = [
    { icon: <Shield size={16} />, label: 'Status', value: tx.status.charAt(0).toUpperCase() + tx.status.slice(1), highlight: true },
    { icon: <Clock size={16} />, label: 'Timestamp', value: date.toLocaleString() },
    { icon: <Award size={16} />, label: 'Reputation Score', value: `${tx.score}/100` },
    { icon: <Layers size={16} />, label: 'Network', value: tx.chain },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6 pb-10">
      <button
        onClick={() => navigate('/identity')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl"
      >
        <ArrowLeft size={16} /> Back to Identity
      </button>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-5 flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2.5 rounded-full">
            <CheckCircle size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Verification Transaction</h1>
            <p className="text-emerald-600 text-xs font-bold mt-0.5">Permanently recorded on CHOICE Cloud</p>
          </div>
        </div>

        {/* TX Hash */}
        <div className="px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transaction Hash</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-primary break-all flex-1">{tx.tx_hash}</code>
            <button
              onClick={() => handleCopy(tx.tx_hash, 'hash')}
              className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {copied === 'hash' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Wallet */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wallet Address</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-foreground break-all flex-1">{tx.wallet_address}</code>
            <button
              onClick={() => handleCopy(tx.wallet_address, 'wallet')}
              className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {copied === 'wallet' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Reputation Hash */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reputation Hash</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-muted-foreground break-all flex-1">{tx.reputation_hash}</code>
            <button
              onClick={() => handleCopy(tx.reputation_hash, 'rep')}
              className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {copied === 'rep' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Details rows */}
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                {row.icon}
                <span className="text-sm font-semibold">{row.label}</span>
              </div>
              <span className={`text-sm font-bold ${row.highlight ? 'text-emerald-600' : 'text-foreground'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Record ID */}
        <div className="px-6 py-4 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Record ID</span>
            <code className="text-[10px] font-mono text-muted-foreground">{tx.id}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionViewPage;
