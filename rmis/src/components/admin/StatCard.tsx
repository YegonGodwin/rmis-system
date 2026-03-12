type StatCardProps = {
  label: string
  value: string
  delta: string
  tone: 'good' | 'warn' | 'neutral'
}

const toneClass: Record<StatCardProps['tone'], string> = {
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  neutral: 'bg-sky-50 text-sky-700',
}

const StatCard = ({ label, value, delta, tone }: StatCardProps) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${toneClass[tone]}`}>
        {delta}
      </p>
    </article>
  )
}

export default StatCard
