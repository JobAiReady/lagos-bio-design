import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Shield, Users, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import CohortManager from '../components/admin/CohortManager';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('analytics');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalErrors: 0,
        avgTimeOnTask: 0
    });

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/');
            return;
        }

        const checkAccessAndFetch = async () => {
            // Server-side admin role check via RPC
            const { data: isAdmin, error: roleError } = await supabase.rpc('check_admin_role');

            if (roleError || !isAdmin) {
                alert('Access Denied: Admins Only');
                navigate('/');
                return;
            }

            const { data, error } = await supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching analytics:', error);
            } else {
                setEvents(data);
                // Process stats inline
                const uniqueUsers = new Set(data.map(e => e.user_id)).size;
                const errors = data.filter(e => e.event_type === 'error').length;
                const heartbeats = data.filter(e => e.event_type === 'heartbeat').length;
                const totalMinutes = heartbeats;
                const avgMinutes = uniqueUsers > 0 ? Math.round(totalMinutes / uniqueUsers) : 0;
                setStats({
                    totalUsers: uniqueUsers,
                    totalErrors: errors,
                    avgTimeOnTask: avgMinutes
                });
            }
            setLoading(false);
        };

        checkAccessAndFetch();
    }, [authLoading, user, navigate]);

    // Prepare chart data
    const eventsByType = events.reduce((acc, curr) => {
        acc[curr.event_type] = (acc[curr.event_type] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.keys(eventsByType).map(key => ({
        name: key,
        count: eventsByType[key]
    }));

    if (loading) {
        return <div className="h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Loading Analytics...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowLeft />
                        </button>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Shield className="text-emerald-500" />
                            Instructor Dashboard
                        </h1>
                    </div>
                    <div className="text-sm text-slate-500">
                        Lagos Bio-Design Bootcamp
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit">
                    {['analytics', 'cohorts'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                                activeTab === tab
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'cohorts' ? (
                    <CohortManager />
                ) : (
                <>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3 text-slate-400 mb-2">
                            <Users size={20} />
                            <span className="text-sm uppercase tracking-wider">Active Students</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats.totalUsers}</div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3 text-slate-400 mb-2">
                            <Clock size={20} />
                            <span className="text-sm uppercase tracking-wider">Avg. Time on Task</span>
                        </div>
                        <div className="text-4xl font-bold text-blue-400">{stats.avgTimeOnTask} <span className="text-lg text-slate-500">min</span></div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3 text-slate-400 mb-2">
                            <AlertTriangle size={20} />
                            <span className="text-sm uppercase tracking-wider">Total Errors</span>
                        </div>
                        <div className="text-4xl font-bold text-red-400">{stats.totalErrors}</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-6">Event Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                    />
                                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-6">Recent Activity Log</h3>
                        <div className="h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {events.slice().reverse().slice(0, 20).map(event => (
                                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${event.event_type === 'error' ? 'bg-red-500' :
                                                event.event_type === 'heartbeat' ? 'bg-blue-500' : 'bg-emerald-500'
                                            }`}></span>
                                        <span className="font-mono text-slate-300">{event.event_type}</span>
                                    </div>
                                    <span className="text-slate-500 text-xs">
                                        {new Date(event.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
