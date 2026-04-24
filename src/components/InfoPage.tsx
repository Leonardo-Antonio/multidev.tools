import { useTranslation } from 'react-i18next'

interface InfoPageProps {
  pageKey: 'privacy' | 'terms' | 'about' | 'contact'
}

interface Section {
  title: string
  body: string
}

export function InfoPage({ pageKey }: InfoPageProps) {
  const { t } = useTranslation()
  const heading = t(`pages.${pageKey}.heading`)
  const updated = t(`pages.${pageKey}.updated`, '')
  const sections = t(`pages.${pageKey}.sections`, { returnObjects: true }) as Section[] | string

  if (pageKey === 'contact') {
    return (
      <article className="info-page">
        <h1>{heading}</h1>
        <p className="info-intro">{t('pages.contact.intro')}</p>
        <div className="info-contact-block">
          <p>
            <strong>{t('pages.contact.email_label')}:</strong>{' '}
            <a href={`mailto:${t('pages.contact.email')}`}>{t('pages.contact.email')}</a>
          </p>
          <p className="info-note">{t('pages.contact.response_note')}</p>
        </div>
      </article>
    )
  }

  const sectionsArr = Array.isArray(sections) ? sections : []

  return (
    <article className="info-page">
      <h1>{heading}</h1>
      {updated && typeof updated === 'string' && (
        <p className="info-updated">{updated}</p>
      )}
      {sectionsArr.map((s, i) => (
        <section key={i} className="info-section">
          <h2>{s.title}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </article>
  )
}
