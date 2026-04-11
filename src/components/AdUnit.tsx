import { useEffect, useRef } from 'react'
import { ADSENSE_CONFIG } from '../adsConfig'

interface AdUnitProps {
  slot: keyof typeof ADSENSE_CONFIG.slots
  format?: 'auto' | 'vertical' | 'horizontal' | 'rectangle'
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function AdUnit({ slot, format = 'auto', className = '' }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense script not loaded or ad blocker active
    }
  }, [])

  return (
    <div className={`ad-unit ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CONFIG.publisherId}
        data-ad-slot={ADSENSE_CONFIG.slots[slot]}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
