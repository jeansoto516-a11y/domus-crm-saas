import { useState } from 'react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import '../styles/dark-theme.css';

const CHART_TYPE_LABELS = {
    line: 'Linha',
    bar: 'Barras',
    area: 'Area',
    pie: 'Pizza'
};

const DEFAULT_COLORS = ['#6c5ce7', '#00cec9', '#fdcb6e', '#e17055', '#0984e3', '#d63031'];

function ChartCard({ title, data, availableTypes = ['line', 'bar', 'area', 'pie'], initialType, colors = DEFAULT_COLORS, valueLabel = 'Total' }) {
    const [type, setType] = useState(initialType || availableTypes[0]);
    const [menuOpen, setMenuOpen] = useState(false);

    const selectType = (t) => {
    setType(t);
    setMenuOpen(false);
    };

    const renderChart = () => {
    if (!data || data.length === 0) {
        return <p style={{ color: 'var(--dd-muted)' }}>Sem dados no periodo.</p>;
    }

    if (type === 'line') {
        return (
        <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" stroke="var(--dd-muted, #888)" fontSize={12} />
            <YAxis stroke="var(--dd-muted, #888)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1c1c22', border: '1px solid #2a2a33' }} />
            <Line type="monotone" dataKey="value" name={valueLabel} stroke={colors[0]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
        </ResponsiveContainer>
        );
    }

    if (type === 'bar') {
        return (
        <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" stroke="var(--dd-muted, #888)" fontSize={12} />
            <YAxis stroke="var(--dd-muted, #888)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1c1c22', border: '1px solid #2a2a33' }} />
            <Bar dataKey="value" name={valueLabel} radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                <Cell key={entry.label} fill={colors[index % colors.length]} />
                ))}
            </Bar>
            </BarChart>
        </ResponsiveContainer>
        );
    }

    if (type === 'area') {
        return (
        <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" stroke="var(--dd-muted, #888)" fontSize={12} />
            <YAxis stroke="var(--dd-muted, #888)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1c1c22', border: '1px solid #2a2a33' }} />
            <Area type="monotone" dataKey="value" name={valueLabel} stroke={colors[0]} fill={colors[0]} fillOpacity={0.25} />
            </AreaChart>
        </ResponsiveContainer>
        );
    }

    if (type === 'pie') {
        return (
        <ResponsiveContainer width="100%" height={260}>
            <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                {data.map((entry, index) => (
                <Cell key={entry.label} fill={colors[index % colors.length]} />
                ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1c1c22', border: '1px solid #2a2a33' }} />
            <Legend />
            </PieChart>
        </ResponsiveContainer>
        );
    }

    return null;
    };

    return (
    <article className="dd-chart-card">
        <div className="dd-chart-card-head">
        <h3>{title}</h3>

        <div className="dd-chart-menu-wrap">
            <button className="dd-chart-menu-btn" onClick={() => setMenuOpen((v) => !v)}>⋮</button>

            {menuOpen && (
            <>
                <div className="dd-chart-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="dd-chart-menu">
                {availableTypes.map((t) => (
                    <button
                    key={t}
                    className={`dd-chart-menu-item${t === type ? ' active' : ''}`}
                    onClick={() => selectType(t)}
                    >
                    {CHART_TYPE_LABELS[t]}
                    </button>
                ))}
                </div>
                </>
            )}
        </div>
        </div>

        {renderChart()}
    </article>
    );
}

export default ChartCard;