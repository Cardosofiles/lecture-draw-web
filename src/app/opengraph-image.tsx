import { ImageResponse } from 'next/og'

import {
  brandSymbolDataUri,
  hudBackdropDataUri,
  loadBrandFonts,
} from '@/shared/utils/seo/og-assets'
import { SITE } from '@/shared/utils/seo/site'

export const alt = SITE.title
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const FEATURE_TAGS = [
  'SPEC-DRIVEN DEVELOPMENT (SDD)',
  'ENGENHARIA GUIADA POR IA',
  'SORTEIO DE 5 PCS DEV',
  'WINDOWS 11 / UBUNTU',
]

// Posição Y da linha divisória horizontal no HUD (418px).
// A seção principal da palestra fica acima e o badge do sorteio fica abaixo.
const HUD_LINE_Y = 418

export default async function OpenGraphImage(): Promise<ImageResponse> {
  const fonts = await loadBrandFonts()

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 64px',
        backgroundColor: '#03060c',
        fontFamily: 'Inter',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Imagem de fundo com Grid HUD cibernético e linha divisória neon */}
      <img
        src={hudBackdropDataUri(HUD_LINE_Y)}
        width={1200}
        height={630}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* Header com Marca do Evento e Badge de Status Ao Vivo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={brandSymbolDataUri('#00e5ff')} width={48} height={48} alt="" />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: 16,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: '#e5f1ff' }}>AI LECTURE</span>
            <span style={{ color: '#00e5ff', marginLeft: 10, opacity: 0.85 }}>{'// UNITRI'}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '7px 16px',
            borderRadius: 999,
            border: '1px solid rgba(0, 229, 255, 0.4)',
            backgroundColor: 'rgba(0, 229, 255, 0.08)',
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: '#2cf2a3',
              marginRight: 9,
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#e5f1ff',
            }}
          >
            PALESTRA OFICIAL & SORTEIO
          </span>
        </div>
      </div>

      {/* Seção Superior/Central: Foco na Palestra Spec-Driven Development (SDD) (Fica acima da linha horizontal) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Eyebrow técnico */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#00e5ff',
            }}
          >
            PALESTRA DE INTELIGÊNCIA ARTIFICIAL // UNITRI
          </span>
        </div>

        {/* Headline focado em Spec-Driven Development (SDD) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: '-0.035em',
          }}
        >
          <span style={{ color: '#e5f1ff' }}>Spec-Driven Development</span>
          <span style={{ color: '#00e5ff' }}>(SDD) com Inteligência Artificial</span>
        </div>

        {/* Resumo da Palestra */}
        <span
          style={{
            marginTop: 12,
            maxWidth: 880,
            fontSize: 19,
            lineHeight: 1.35,
            color: '#7b95b8',
          }}
        >
          Como especificar, guiar e acelerar o desenvolvimento de software com IA generativa.
          Participe na Unitri e concorra a 5 setups completos.
        </span>
      </div>

      {/* Seção Inferior: Posicionada ABAIXO da linha horizontal */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          position: 'relative',
          paddingTop: 24,
        }}
      >
        {/* Badge do Sorteio — Explicitamente posicionado abaixo da linha horizontal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 18px',
            borderRadius: 8,
            border: '1px solid rgba(255, 57, 210, 0.45)',
            backgroundColor: 'rgba(255, 57, 210, 0.1)',
            maxWidth: 750,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#ff39d2',
              marginRight: 10,
            }}
          >
            SORTEIO AO VIVO:
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#e5f1ff',
            }}
          >
            5 Configurações de ambiente de desenvolvimento (Windows 11 / Ubuntu Linux)
          </span>
        </div>

        {/* Rodapé: Tags Técnicas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {FEATURE_TAGS.map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid rgba(0, 229, 255, 0.22)',
                backgroundColor: 'rgba(6, 11, 22, 0.85)',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#e5f1ff',
                }}
              >
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    { ...size, fonts }
  )
}
