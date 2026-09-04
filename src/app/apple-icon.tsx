import { ImageResponse } from 'next/og'

import { appIconDataUri } from '@/shared/utils/seo/og-assets'
import { SITE } from '@/shared/utils/seo/site'

export const alt = SITE.name
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Ícone para a tela inicial do iOS (Apple Touch Icon).
 * O preenchimento vai até a borda sem raio artificial (radius = 0),
 * pois o próprio sistema iOS aplica a máscara com cantos arredondados.
 */
export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#03060c',
      }}
    >
      <img src={appIconDataUri(0)} width={size.width} height={size.height} alt="" />
    </div>,
    size
  )
}
