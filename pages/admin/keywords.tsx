// pages/admin/keywords.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type KeywordRow = {
  id: string;
  keyword: string;
  polarity: string;
};

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [kw, setKw] = useState('');
  const [polarity, setPolarity] = useState('positive');
  const [loading, setLoading] = useState(false);

  async function loadKeywords() {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading keywords', error);
      return;
    }
    setKeywords(data || []);
  }

  useEffect(() => {
    loadKeywords();
  }, []);

  // ⭐ UPDATED:
  async function addKeyword() {
    if (!kw.trim()) return alert('Enter a keyword');

    setLoading(true);

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: kw.trim(),
          polarity,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert('Error adding keyword: ' + json.error);
      } else {
        setKw('');
        loadKeywords(); // refresh
      }
    } catch (err: any) {
      alert('Unexpected error: ' + err.message);
    }

    setLoading(false);
  }

  async function deleteKeyword(id: string) {
    if (!confirm('Delete this keyword?')) return;

    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting: ' + error.message);
      return;
    }

    loadKeywords();
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 20 }}>
      <h2>Manage Keywords</h2>

      <div style={{ marginBottom: 16 }}>
        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="e.g., good, slow, excellent"
          style={{ padding: 8, width: '55%' }}
        />

        <select
          value={polarity}
          onChange={(e) => setPolarity(e.target.value)}
          style={{ padding: 8, marginLeft: 8 }}
        >
          <option value="positive">positive</option>
          <option value="negative">negative</option>
          <option value="definite">definite</option>
        </select>

        <button onClick={addKeyword} disabled={loading} style={{ padding: 8, marginLeft: 8 }}>
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>

      <ul>
        {keywords.map((k) => (
          <li key={k.id} style={{ marginBottom: 8 }}>
            <strong>{k.keyword}</strong> — {k.polarity}
            <button onClick={() => deleteKeyword(k.id)} style={{ marginLeft: 10 }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
