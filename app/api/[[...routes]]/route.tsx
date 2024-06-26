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
      <Button action='/tipCreator'>Tip</Button>,
      <Button.Link href='https://www.farmix.online/'>Website</Button.Link>,
      <Button.Link href="https://warpcast.com/~/compose?text=%F0%9F%8C%90%20Find%20Your%20Digital%20Twin%20on%20Warpcast!%20%F0%9F%9A%80%0A%0AThis%20frame%20allows%20users%20to%20discover%20their%20digital%20twins%20on%20Warpcast%20by%20comparing%20owned%20tokens%20and%20NFTs.%20With%20a%20unique%20similarity%20score%20feature,%20users%20can%20find%20out%20how%20alike%20they%20are%20with%20others%20in%20the%20community.%20%0A%0AWant%20to%20find%20your%20own%20digital%20twin%20and%20see%20how%20similar%20you%20are%20with%20someone?%20Join%20Farmix%20now%20and%20explore%20the%20exciting%20world%20of%20digital%20assets!%0A%0ACheckout%20the%20Detailed%20Analysis%20here:%20https%3A%2F%2Ffarmix.online%2F%0A%0Ahttps%3A%2F%2Ffarmix-frame.vercel.app%2Fapi%2F%20">Share</Button.Link>
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
      <Button.Redirect location='https://main.d1mk2y9g4ss2pn.amplifyapp.com/'>Website</Button.Redirect>,
    ]
  })
})

app.frame("/tipCreator", async (c) => {

  return c.res({
    image: '/tips.png',
    intents: [
      <TextInput placeholder="Quantify our work in ETH"/>,
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
