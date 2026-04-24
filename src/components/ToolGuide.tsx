import { useTranslation } from 'react-i18next'

interface ToolGuideProps {
  toolId: string
}

interface FaqItem {
  q: string
  a: string
}

export function ToolGuide({ toolId }: ToolGuideProps) {
  const { t } = useTranslation()

  const intro = t(`guides.${toolId}.intro`, '')
  const steps = t(`guides.${toolId}.steps`, { returnObjects: true }) as string[] | string
  const useCases = t(`guides.${toolId}.use_cases`, { returnObjects: true }) as string[] | string
  const faq = t(`guides.${toolId}.faq`, { returnObjects: true }) as FaqItem[] | string

  if (!intro || typeof intro !== 'string') return null

  const stepsArr = Array.isArray(steps) ? steps : []
  const useCasesArr = Array.isArray(useCases) ? useCases : []
  const faqArr = Array.isArray(faq) ? faq : []

  return (
    <section className="tool-guide" aria-label="Guide">
      <p className="tool-guide-intro">{intro}</p>

      {stepsArr.length > 0 && (
        <div className="tool-guide-section">
          <h3>{t('guides.common.how_to_title')}</h3>
          <ol>
            {stepsArr.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {useCasesArr.length > 0 && (
        <div className="tool-guide-section">
          <h3>{t('guides.common.use_cases_title')}</h3>
          <ul>
            {useCasesArr.map((uc, i) => (
              <li key={i}>{uc}</li>
            ))}
          </ul>
        </div>
      )}

      {faqArr.length > 0 && (
        <div className="tool-guide-section">
          <h3>{t('guides.common.faq_title')}</h3>
          <dl className="tool-guide-faq">
            {faqArr.map((item, i) => (
              <div key={i} className="tool-guide-faq-item">
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="tool-guide-section tool-guide-privacy">
        <h3>{t('guides.common.privacy_note_title')}</h3>
        <p>{t('guides.common.privacy_note_text')}</p>
      </div>
    </section>
  )
}
