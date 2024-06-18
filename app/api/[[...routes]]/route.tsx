/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { calculateSimilarity } from '@/app/_actions/queries'

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/', async (c) => {
  const { buttonValue, inputText, status, frameData } = c 
  // const { fid } = frameData;
  const username = inputText || ''
  console.log(username)

  let similarityScore = 0

  let loading = false

  if (buttonValue === 'similarity') {
    loading = true
    const similarity = await calculateSimilarity("flamekaiser", username)
    similarityScore = similarity.similarityScore
    c.status = 'response'
    c.similarityScore = similarityScore
    loading = false
  }

  similarityScore = c.similarityScore || 0

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            c.status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {loading === true
            ? "Calculating similarity..."
            : c.status === 'response'
              ? `Similarity Score: ${similarityScore.toFixed(2)}%`
              :
              "Welcome to Farmix!\nCheck out similarity between you and your friends now!"
          }
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter Farcaster username" />,
      <Button value='similarity' >Check Similarity</Button>,
      c.status === 'response' && <Button.Reset>Reset</Button.Reset>,
    ],
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
