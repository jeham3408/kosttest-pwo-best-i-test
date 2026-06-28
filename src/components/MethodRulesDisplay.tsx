export type MethodRuleItem = {
  label: string
  weight: string
  note: string
}

export type PwoMethodRuleItem = MethodRuleItem & {
  key: string
  doses?: { grade: string; value: string }[]
}

export function MethodRulesCards({
  rules,
  caption,
}: {
  rules: MethodRuleItem[]
  caption?: string
}) {
  return (
    <div className="method-rules-block">
      {caption ? <p className="method-rules-caption">{caption}</p> : null}
      <div className="method-rules-cards">
        {rules.map((rule) => (
          <article key={rule.label} className="method-rule-card">
            <div className="method-rule-card-head">
              <strong>{rule.label}</strong>
              <span className="method-rule-weight">{rule.weight}</span>
            </div>
            <p>{rule.note}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

export function MethodBadgeCards({
  badges,
  caption,
}: {
  badges: { title: string; explanation: string; disclaimerText?: string }[]
  caption?: string
}) {
  return (
    <div className="method-rules-block">
      {caption ? <p className="method-rules-caption">{caption}</p> : null}
      <div className="method-rules-cards">
        {badges.map((badge) => (
          <article key={badge.title} className="method-rule-card">
            <div className="method-rule-card-head">
              <strong>{badge.title}</strong>
            </div>
            <p>{badge.explanation}</p>
            {badge.disclaimerText ? (
              <p className="method-rule-disclaimer" style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 0' }}>
                {badge.disclaimerText}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}

export function PwoMethodRulesCards({
  rules,
  caption,
}: {
  rules: PwoMethodRuleItem[]
  caption?: string
}) {
  return (
    <div className="method-rules-block">
      {caption ? <p className="method-rules-caption">{caption}</p> : null}
      <div className="method-rules-cards">
        {rules.map((rule) => (
          <article key={rule.key} className="method-rule-card">
            <div className="method-rule-card-head">
              <strong>{rule.label}</strong>
              <span className="method-rule-weight">{rule.weight}</span>
            </div>
            <p>{rule.note}</p>
            {rule.doses && rule.doses.length > 0 && (
              <dl className="method-rule-doses">
                {rule.doses.map(({ grade, value }) => (
                  <div key={grade}>
                    <dt>{grade}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
