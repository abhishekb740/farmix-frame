/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { calculateSimilarity } from '@/app/_actions/queries'

type State = {
  loading: boolean,
  similarityScore: number | null,
}

const app = new Frog<{ State: State }>({
  assetsPath: '/',
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
          {"Welcome to Farmix!\nCheck out similarity between you and your friends now!"}
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter Farcaster username" />,
      <Button action='/loading' value='similarity'>Check Similarity</Button>,
      c.status === 'response' && <Button.Reset>Reset</Button.Reset>,
    ],
  })
})

app.frame("/loading", async (c) => {

  const { buttonValue, deriveState, inputText } = c
  const username = inputText || ''

  if (buttonValue === 'similarity') {

    await deriveState(async (previousState) => {
      previousState.similarityScore = null;
    });

    const similarity = await calculateSimilarity("flamekaiser", username);

    await deriveState(async (previousState) => {
      previousState.similarityScore = similarity.similarityScore;
    });
  }

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
          Calculating similarity...Please wait for a minute!
        </div>
      </div>
    ),
    intents: [
      <Button action='/submit'>Next</Button>,
      <Button.Reset>Reset</Button.Reset>
    ]
  })
})

app.frame('/submit', async (c) => {
  const { buttonValue, deriveState } = c

  const state = await deriveState()

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
          {c.status === "response" && `Similarity Score: ${state.similarityScore?.toFixed(2)}%`}
        </div>
      </div>
    ),
    intents: [
      <Button.Reset>Reset</Button.Reset>,
    ],
  })
})



devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
