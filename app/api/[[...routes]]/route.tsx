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
  assetsPath: `${process.env.VERCEL_URL}/`,
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

  const { buttonValue, deriveState, inputText, status, frameData } = c
  const username = inputText || ''
  console.log(frameData?.fid)
  if (buttonValue === 'similarity') {
    await deriveState(async (previousState) => {
      previousState.similarityScore = (await calculateSimilarity("flamekaiser", username)).similarityScore;
    });
  }
  const state = await deriveState()

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
          {status === 'response' ? `${state.similarityScore?.toFixed(2)}` : buttonValue==='similarity' ? 'Loading...' : 'Welcome to Farmix!' }
        </div>
      </div>
    ),
    intents: [
      status === 'initial' && <TextInput placeholder="Enter Farcaster username" />,
      status === 'initial' && <Button value='similarity'>Calculate Similarity</Button>,
      status === 'response' && <Button>Check Similarity</Button>,
      c.status === 'response' && <Button.Reset>Reset</Button.Reset>,
    ],
  })
})

// app.frame("/loading", async (c) => {



//   return c.res({
//     image: (
//       <div
//         style={{
//           alignItems: 'center',
//           background: 'black',
//           backgroundSize: '100% 100%',
//           display: 'flex',
//           flexDirection: 'column',
//           flexWrap: 'nowrap',
//           height: '100%',
//           justifyContent: 'center',
//           textAlign: 'center',
//           width: '100%',
//         }}
//       >
//         <div
//           style={{
//             color: 'white',
//             fontSize: 60,
//             fontStyle: 'normal',
//             letterSpacing: '-0.025em',
//             lineHeight: 1.4,
//             marginTop: 30,
//             padding: '0 120px',
//             whiteSpace: 'pre-wrap',
//           }}
//         >
//           Calculating similarity...Please wait for a minute!
//         </div>
//       </div>
//     ),
//     intents: [
//       <Button action='/submit'>Next</Button>,
//       <Button.Reset>Reset</Button.Reset>
//     ]
//   })
// })

// app.frame('/submit', async (c) => {
//   const { buttonValue, deriveState } = c

//   const state = await deriveState()

//   return c.res({
//     image: (
//       <div
//         style={{
//           alignItems: 'center',
//           background: 'black',
//           backgroundSize: '100% 100%',
//           display: 'flex',
//           flexDirection: 'column',
//           flexWrap: 'nowrap',
//           height: '100%',
//           justifyContent: 'center',
//           textAlign: 'center',
//           width: '100%',
//         }}
//       >
//         <div
//           style={{
//             color: 'white',
//             fontSize: 60,
//             fontStyle: 'normal',
//             letterSpacing: '-0.025em',
//             lineHeight: 1.4,
//             marginTop: 30,
//             padding: '0 120px',
//             whiteSpace: 'pre-wrap',
//           }}
//         >
//           {c.status === "response" && `Similarity Score: ${state.similarityScore?.toFixed(2)}%`}
//         </div>
//       </div>
//     ),
//     intents: [
//       <Button.Reset>Reset</Button.Reset>,
//     ],
//   })
// })



devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
