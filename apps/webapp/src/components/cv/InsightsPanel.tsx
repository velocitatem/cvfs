'use client';

import type { InsightsResult } from '@/libs/api';

function Bar({ rate, positive }: { rate: number; positive?: boolean }) {
    return (
        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
                width: `${Math.round(rate * 100)}%`,
                height: '100%',
                background: positive === false ? '#ef4444' : rate >= 0.6 ? '#22c55e' : rate >= 0.4 ? '#f59e0b' : '#94a3b8',
                borderRadius: 3,
                transition: 'width 0.3s',
            }} />
        </div>
    );
}

function Pct({ v }: { v: number }) {
    return <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 600, color: v >= 0.6 ? '#16a34a' : v >= 0.4 ? '#d97706' : '#6b7280' }}>{Math.round(v * 100)}%</span>;
}

export default function InsightsPanel({ data }: { data: InsightsResult | null }) {
    if (!data) return (
        <div style={{ padding: '24px 0', color: 'var(--text-faint)', fontSize: 13, textAlign: 'center' }}>
            Loading insights…
        </div>
    );

    if (!data.has_data) return (
        <div style={{ padding: '24px 0', color: 'var(--text-faint)', fontSize: 13 }}>
            Not enough data yet. Submit applications and mark outcomes to unlock insights.
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* headline numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                    { label: 'Total submissions', value: data.total_submissions },
                    { label: 'Passed screening', value: data.positive_count },
                    { label: 'Screening rate', value: `${Math.round(data.positive_rate * 100)}%` },
                ].map(({ label, value }) => (
                    <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: 'var(--surface)' }}>
                        <div className="label" style={{ marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* operation impact */}
            {data.operation_impact.length > 0 && (
                <section>
                    <div className="label" style={{ marginBottom: 8 }}>Patch operation impact</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {data.operation_impact.map(op => (
                            <div key={op.operation} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, width: 140, flexShrink: 0, color: 'var(--text-muted)' }}>
                                    {op.operation}
                                </span>
                                <Bar rate={op.rate} />
                                <Pct v={op.rate} />
                                <span style={{ fontSize: 11, color: 'var(--text-faint)', width: 50, textAlign: 'right' }}>
                                    {op.positive}/{op.total}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                        % of accepted patches of this type in submissions that passed screening.
                    </p>
                </section>
            )}

            {/* section impact */}
            {data.section_impact.length > 0 && (
                <section>
                    <div className="label" style={{ marginBottom: 8 }}>CV section impact</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {data.section_impact.map(s => (
                            <div key={s.section} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, width: 80, flexShrink: 0, color: 'var(--text-muted)' }}>
                                    {s.section}
                                </span>
                                <Bar rate={s.positive_rate} />
                                <Pct v={s.positive_rate} />
                                <span style={{ fontSize: 11, color: 'var(--text-faint)', width: 50, textAlign: 'right' }}>
                                    {s.count} edits
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* keyword signals */}
            {(data.top_positive_keywords.length > 0 || data.top_negative_keywords.length > 0) && (
                <section>
                    <div className="label" style={{ marginBottom: 8 }}>Keyword signals</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 6 }}>Positive signals</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {data.top_positive_keywords.map(k => (
                                    <div key={k.keyword} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{k.keyword}</span>
                                        <span style={{ fontSize: 11, color: '#16a34a' }}>+{k.positive_count} ({k.lift}×)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginBottom: 6 }}>Negative signals</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {data.top_negative_keywords.length === 0
                                    ? <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>None yet</span>
                                    : data.top_negative_keywords.map(k => (
                                        <div key={k.keyword} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{k.keyword}</span>
                                            <span style={{ fontSize: 11, color: '#dc2626' }}>{k.negative_count}×</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                        Keywords extracted from accepted AI suggestions, split by outcome.
                    </p>
                </section>
            )}
        </div>
    );
}
