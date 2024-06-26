/** @jsxImportSource frog/jsx */

import { Button, Frog, parseEther, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { abi } from "./abi"

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
    image: '/metadata.png',
    intents: [
      status === 'initial' && <TextInput placeholder="Enter Farcaster username" />,
      status === 'initial' && <Button value='similarity' action='/loading'>Calculate Similarity</Button>,
    ],
  })
})

app.frame("/loading", async (c) => {
  const { inputText, frameData, buttonValue, deriveState } = c
  const username = inputText || ''

  if (buttonValue === 'similarity') {
    const resp = fetch("https://farmix-frame-server-production.up.railway.app/calculateSimilarity", {
      method: "POST",
      body: JSON.stringify({
        fid: frameData?.fid.toString() ?? '',
        secondaryUsername: username,
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const state = await deriveState(async previousState => {
    if (buttonValue === 'refresh') {
      // frameData?.fid.toString() ?? ''
      const resp = await fetch("https://farmix-frame-server-production.up.railway.app/getSimilarityScore", {
        method: "POST",
        body: JSON.stringify({
          fid: frameData?.fid.toString() ?? ''
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!resp.ok) {
        throw new Error(`Error: ${resp.status} ${resp.statusText}`);
      }
      console.log("Similarity data:", resp);

      const data = await resp.json();
      previousState.similarityScore = data;
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
      <Button.Reset>Reset</Button.Reset>,
      <Button action='/tipCreator'>Tip</Button>
    ]
  })
})

app.frame("/tipCreator", async (c) => {

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
          Enter the amount you want to tip
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter the eth you want to tip" />,
      <Button action='/loading'>Go Back</Button>,
      <Button.Reset>Reset</Button.Reset>,
      <Button.Transaction target='/tip'>Tip</Button.Transaction>,
    ]
  })
});

app.transaction('/tip', async (c) => {
  const { inputText } = c;
  // Check if input text is only numbers
  // if (!/^\d+$/.test(inputText ?? '')) {
    
  // }
  return c.contract({
    abi,
    chainId: "eip155:84532",
    functionName: "tip",
    to: "0x86402C7dF6a09eD98C82922dD448334e974Da9F2",
    value: parseEther(inputText ?? '0.004'),
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
