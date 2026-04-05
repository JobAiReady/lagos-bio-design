import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Key, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { fetchCohorts, createCohort, updateCohort, generateAccessCode } from '../../lib/cohorts';

const CohortManager = () => {
    const [cohorts, setCohorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        startDate: '',
        maxStudents: 50,
        accessCode: generateAccessCode(),
    });

    useEffect(() => {
        loadCohorts();
    }, []);

    const loadCohorts = async () => {
        try {
            const data = await fetchCohorts();
            setCohorts(data);
        } catch (err) {
            console.error('Failed to load cohorts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await createCohort(form);
            setShowForm(false);
            setForm({ name: '', startDate: '', maxStudents: 50, accessCode: generateAccessCode() });
            await loadCohorts();
        } catch (err) {
            console.error('Failed to create cohort:', err);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (cohort) => {
        try {
            await updateCohort(cohort.id, { is_active: !cohort.is_active });
            await loadCohorts();
        } catch (err) {
            console.error('Failed to toggle cohort:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Cohort Management</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus size={16} />
                    New Cohort
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Cohort Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Lagos Bio-Design Cohort 2"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                            <input
                                type="date"
                                required
                                value={form.startDate}
                                onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Max Students</label>
                            <input
                                type="number"
                                min="1"
                                value={form.maxStudents}
                                onChange={(e) => setForm(f => ({ ...f, maxStudents: parseInt(e.target.value) || 50 }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Access Code</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={form.accessCode}
                                onChange={(e) => setForm(f => ({ ...f, accessCode: e.target.value }))}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                            />
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, accessCode: generateAccessCode() }))}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Creating...' : 'Create Cohort'}
                        </button>
                    </div>
                </form>
            )}

            {/* Cohorts Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-4 py-3 text-left">Cohort</th>
                            <th className="px-4 py-3 text-left">Access Code</th>
                            <th className="px-4 py-3 text-center">Enrolled</th>
                            <th className="px-4 py-3 text-center">Start</th>
                            <th className="px-4 py-3 text-center">Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cohorts.map(c => (
                            <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-750">
                                <td className="px-4 py-3 text-slate-200 font-medium">{c.name}</td>
                                <td className="px-4 py-3">
                                    <code className="text-xs font-mono text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded">
                                        {c.access_code}
                                    </code>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-300">
                                    <span className="flex items-center justify-center gap-1">
                                        <Users size={14} className="text-slate-500" />
                                        {c.enrolled}/{c.max_students}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-400 text-xs">
                                    <span className="flex items-center justify-center gap-1">
                                        <Calendar size={14} className="text-slate-500" />
                                        {new Date(c.start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => toggleActive(c)}
                                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                                        aria-label={c.is_active ? 'Deactivate cohort' : 'Activate cohort'}
                                    >
                                        {c.is_active
                                            ? <ToggleRight size={22} className="text-emerald-500" />
                                            : <ToggleLeft size={22} />
                                        }
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {cohorts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                    No cohorts yet. Create your first one above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CohortManager;
