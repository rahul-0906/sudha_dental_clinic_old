import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Trash2, Plus, RefreshCw, Settings, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function MappingView() {
  const [mappings, setMappings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Create mapping form state
  const [procedureName, setProcedureName] = useState('');
  const [inventoryId, setInventoryId] = useState('');
  const [quantityRequired, setQuantityRequired] = useState('1');
  const [successMsg, setSuccessMsg] = useState('');

  const loadMappingsAndInventory = async () => {
    setLoading(true);
    try {
      const maps = await api.mappings.list();
      setMappings(maps);
      
      const inv = await api.inventory.list();
      setInventory(inv);
      if (inv.length > 0) {
        setInventoryId(inv[0].id.toString());
      }
    } catch (error) {
      console.error("Failed to load mappings or inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappingsAndInventory();
  }, []);

  const handleCreateMapping = async (e) => {
    e.preventDefault();
    if (!procedureName.trim() || !inventoryId || !quantityRequired) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await api.mappings.create({
        procedureName: procedureName.trim(),
        inventoryId: parseInt(inventoryId),
        quantityRequired: parseInt(quantityRequired)
      });
      setProcedureName('');
      setQuantityRequired('1');
      setSuccessMsg("Procedure mapping successfully registered!");
      setTimeout(() => setSuccessMsg(''), 4000);
      loadMappingsAndInventory();
    } catch (error) {
      alert("Failed to create mapping: " + error.message);
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!window.confirm("Are you sure you want to delete this procedure material mapping?")) {
      return;
    }
    try {
      await api.mappings.delete(id);
      loadMappingsAndInventory();
    } catch (error) {
      alert("Failed to delete mapping: " + error.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Procedure to Materials Mapping</h1>
          <p className="text-sm text-slate-500">Configure which inventory supplies are automatically deducted from stock when a treatment record is saved.</p>
        </div>
        <button
          onClick={loadMappingsAndInventory}
          className="p-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 transition"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-2 text-emerald-800 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Creation Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
            <Plus className="w-5 h-5 text-primary-700" />
            <h2 className="text-sm font-bold text-slate-800">Create Auto-Deduction Rule</h2>
          </div>
          <form onSubmit={handleCreateMapping} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>Procedure Name</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Root Canal, Filling"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">Must match the EMR procedure selection case-insensitively.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>Required Material</span>
              </label>
              <select
                value={inventoryId}
                onChange={(e) => setInventoryId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
              >
                {inventory.length === 0 ? (
                  <option value="">No inventory items available</option>
                ) : (
                  inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.materialName} ({item.quantity} {item.unit} left)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quantity Required</label>
              <input
                type="number"
                required
                min="1"
                value={quantityRequired}
                onChange={(e) => setQuantityRequired(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading || inventory.length === 0}
              className="w-full py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition text-sm font-semibold shadow-md disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Register Rule</span>
            </button>
          </form>
        </div>

        {/* List Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary-700" />
            <h2 className="text-sm font-bold text-slate-800">Current Deduction Rules Mapping</h2>
          </div>

          {mappings.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">No deduction rules configured.</p>
              <p className="text-xs mt-1">Configure auto-deductions using the creation panel.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase bg-slate-50/50">
                    <th className="px-6 py-3.5">Procedure Name</th>
                    <th className="px-6 py-3.5">Deducted Material</th>
                    <th className="px-6 py-3.5 text-center">Qty Required</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {mappings.map((map) => (
                    <tr key={map.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">{map.procedureName}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {map.inventoryItem?.materialName || 'Unknown Material'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {map.quantityRequired} <span className="text-xs text-slate-400 font-normal">({map.inventoryItem?.unit || 'pcs'})</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteMapping(map.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition"
                          title="Delete mapping"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
