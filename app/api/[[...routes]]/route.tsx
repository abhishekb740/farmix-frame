/** @jsxImportSource frog/jsx */

import { Button, Frog, parseEther, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { abi } from "../../abi"

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
      status === 'initial' && <Button value='similarity' action='/loading'>🔎</Button>,
      <Button.Link href='https://www.farmix.online/'>Website</Button.Link>,
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
        fid: "500605",
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
          fid: "500605"
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!resp.ok) {
        throw new Error(`Error: ${resp.status} ${resp.statusText}`);
      }
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
          backgroundSize: '100% 100%',
          background: '#9D00FE',
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
            fontSize: 70,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
            display: 'flex'
          }}
        >
          {state.similarityScore === null ?
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '40', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', fontSize: 60 }}>
                Calculating similarity...
              </div>
              <div style={{ display: 'flex', fontSize: 33 }}>
                This may take up to a minute if the user has many NFTs and tokens.
              </div>
              <div style={{ display: 'flex', fontSize: 35 }}>
                Please refresh after a moment to check the similarity score.
              </div>
              <div style={{ display: 'flex', fontSize: 35 }}>
                You can view a detailed analysis on the website.
              </div>
            </div> : 'Similarity Score: ' + state.similarityScore.toFixed(2)}
        </div>
      </div>
    ),
    intents: [
      <Button value='refresh'>Refresh</Button>,
      <Button.Reset>Reset</Button.Reset>,
      <Button action='/tipCreator'>Tip</Button>,
      <Button.Redirect location='https://main.d1mk2y9g4ss2pn.amplifyapp.com/'>Website</Button.Redirect>
    ]
  })
})

app.frame("/tipCreator", async (c) => {

  return c.res({
    image: '/tips.png',
    intents: [
      <TextInput placeholder="Enter the eth you want to tip" />,
      <Button action='/loading'>Go Back</Button>,
      <Button.Reset>Reset</Button.Reset>,
      <Button.Transaction target='/tip'>Tip</Button.Transaction>,
      <Button.Redirect location='https://main.d1mk2y9g4ss2pn.amplifyapp.com/'>Website</Button.Redirect>
    ]
  })
});

app.transaction('/tip', async (c) => {
  const { inputText } = c;
  return c.contract({
    abi,
    chainId: "eip155:8453",
    functionName: "tip",
    to: "0x6cCa9fd3C09a079E5755E887DACD3d09509e30A1",
    value: parseEther(inputText ?? '0.004'),
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
