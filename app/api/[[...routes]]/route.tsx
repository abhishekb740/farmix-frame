/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { calculateSimilarity, getSimilarityScore } from '@/app/_actions/queries'

type State = {
  similarityScore: number | null
}

const app = new Frog<{ State: State }>({
  assetsPath: `/`,
  basePath: '/api',
  initialState: {
    loading: false,
    similarityScore: null,
  }
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/', async (c) => {

  const { status } = c

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
            display: 'flex',
          }}
        >
          Welcome to Farmix!
        </div>
      </div>
    ),
    intents: [
      status === 'initial' && <TextInput placeholder="Enter Farcaster username" />,
      status === 'initial' && <Button value='similarity' action='/loading'>Calculate Similarity</Button>,
    ],
  })
})

app.frame("/loading", async (c) => {
  const { inputText, status, frameData, buttonValue, deriveState } = c
  const username = inputText || ''
  console.log(frameData?.fid)

  if (buttonValue === 'similarity') {
    calculateSimilarity("500605", username)
  }
  
  const state = await deriveState(async previousState => {
    if (buttonValue === 'refresh') {
      // frameData?.fid.toString() ?? ''
      previousState.similarityScore = await getSimilarityScore("500605")
    }
  })
  console.log(state.similarityScore);
  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background: 'black',
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
          {state.similarityScore === null ? 'Calculating similarity...Please wait for a minute!' : 'Similarity Score: ' + state.similarityScore.toFixed(2)}
        </div>
      </div>
    ),
    intents: [
      <Button value='refresh'>Refresh</Button>,
      <Button.Reset>Reset</Button.Reset>
    ]
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
