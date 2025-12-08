// pages/admin/outlets.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing outlets
  async function loadOutlets() {
    const { data, error } = await supabase
      .from('outlets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setOutlets(data || []);
    }
  }

  useEffect(() => {
    loadOutlets();
  }, []);

  // Add new outlet
  async function addOutlet() {
    if (!name.trim()) return alert("Enter a name");

    setLoading(true);

    const { error } = await supabase
      .from('outlets')
      .insert([{ outlet_name: name }]);

    setLoading(false);

    if (error) {
      alert("Error adding outlet: " + error.message);
    } else {
      setName('');
      loadOutlets(); // refresh list
    }
  }

  // Delete outlet
  async function deleteOutlet(id: string) {
    if (!confirm("Delete this outlet?")) return;

    const { error } = await supabase
      .from('outlets')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      loadOutlets();
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h2>Manage Outlets</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Enter outlet name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, width: "70%" }}
        />
        <button
          onClick={addOutlet}
          disabled={loading}
          style={{ padding: 8, marginLeft: 10 }}
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      <ul>
        {outlets.map((o) => (
          <li key={o.id} style={{ marginBottom: 10 }}>
            {o.outlet_name}
            <button
              onClick={() => deleteOutlet(o.id)}
              style={{ marginLeft: 10 }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
