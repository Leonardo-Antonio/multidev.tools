import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'cookie_consent'

interface CookieConsentProps {
  onNavigate: (slug: string) => void
}

export function CookieConsent({ onNavigate }: CookieConsentProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY),
  )

  if (!visible) return null

  const decide = (value: 'accepted' | 'declined') => {
    localStorage.setItem(STORAGE_KEY, value)
    setVisible(false)
  }

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent">
      <div className="cookie-consent-inner">
        <p className="cookie-consent-text">
          {t('consent.message')}{' '}
          <button
            className="cookie-consent-link"
            onClick={() => onNavigate('privacy')}
            type="button"
          >
            {t('consent.learn_more')}
          </button>
        </p>
        <div className="cookie-consent-actions">
          <button
            className="btn btn-ghost"
            onClick={() => decide('declined')}
            type="button"
          >
            {t('consent.decline')}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => decide('accepted')}
            type="button"
          >
            {t('consent.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
