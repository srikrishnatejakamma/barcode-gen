import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [format, setFormat] = useState('qrcode')
  const [text, setText] = useState('Hello world')
  const [includetext, setIncludetext] = useState(true)
  const [scale, setScale] = useState(4)
  const [imageData, setImageData] = useState(null)
  const [savedUrl, setSavedUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generate(save = false) {
    setLoading(true)
    setError(null)
    setImageData(null)
    setSavedUrl(null)
    try {
      const body = {
        format,
        text,
        options: { scale: Number(scale), includetext },
        save
      }
      const res = await fetch('/api/barcodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data && data.detail ? data.detail : (data.error || 'Failed'))
      }
      if (save && data.url) {
        setSavedUrl(data.url)
      } else if (data.image) {
        setImageData(data.image)
      }
    } catch (e) {
      console.error(e)
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Barcode Generator</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <main style={{ fontFamily: 'system-ui,Segoe UI,Roboto,Helvetica,Arial', maxWidth: 980, margin: '24px auto', padding: 12 }}>
        <h1>Barcode Generator</h1>

        <label style={{ display: 'block', marginTop: 8 }}>Barcode format (bcid)</label>
        <input value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: '100%', padding: 8 }} />

        <label style={{ display: 'block', marginTop: 8 }}>Text / Data to encode</label>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', padding: 8 }} />

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <label>Scale</label>
            <input type="number" min="1" value={scale} onChange={(e) => setScale(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginTop: 24 }}>
              <input type="checkbox" checked={includetext} onChange={(e) => setIncludetext(e.target.checked)} /> Include human-readable text
            </label>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => generate(false)} disabled={loading} style={{ padding: '8px 12px' }}>Generate (preview)</button>
          <button onClick={() => generate(true)} disabled={loading} style={{ padding: '8px 12px', marginLeft: 8 }}>Generate & Save</button>
        </div>

        {loading && <div style={{ marginTop: 12 }}>Generating...</div>}
        {error && <div style={{ marginTop: 12, color: 'crimson' }}>Error: {error}</div>}

        {imageData && (
          <div style={{ marginTop: 12 }}>
            <h3>Preview</h3>
            <img alt="barcode preview" src={imageData} style={{ maxWidth: '100%', border: '1px solid #ddd', padding: 8, background: '#fff' }} />
          </div>
        )}

        {savedUrl && (
          <div style={{ marginTop: 12 }}>
            <h3>Saved</h3>
            <a href={savedUrl} target="_blank" rel="noreferrer">Open saved image</a>
          </div>
        )}

        <hr style={{ marginTop: 24 }} />

        <small>
          This UI calls the local server's /api/barcodes/generate endpoint which uses bwip-js. For supported bcids and advanced options see the bwip-js docs: https://github.com/metafloor/bwip-js
        </small>
      </main>
    </>
  )
}