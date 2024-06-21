"use server";

import { CovalentClient } from "@covalenthq/client-sdk";

interface Social {
  connectedAddresses: {
    address: string;
    blockchain: string;
    chainId: string;
    timestamp: string;
  }[];
}

interface FollowingAddress {
  socials: {
    profileName: string;
    dappName: string;
  }[];
}

interface Following {
  followingAddress: FollowingAddress;
}

interface NFTData {
  nft_data?: {
    external_data?: {
      image?: string;
    };
  }[];
  followingAddress?: FollowingAddress;
}

interface TokenData {
  contract_ticker_symbol: string;
}

let similarityScores: Record<string, number | null> = {};

const getUserAddressFromFID = async (fid: string): Promise<string | null> => {
  const query = `query MyQuery {
    Socials(
      input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: "${fid}"}}, blockchain: ethereum}
    ) {
      Social {
        profileName
        connectedAddresses {
          address
        }
      }
    }
  }`;
  const response = await fetch("https://api.airstack.xyz/gql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.AIRSTACK_API_KEY!,
    },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  if (data.Socials && data.Socials.Social.length > 0 && data.Socials.Social[0].connectedAddresses.length > 0) {
    return data.Socials.Social[0].connectedAddresses[0].address;
  }
  return null;
};

const getUserAddressFromFCUsername = async (username: string): Promise<string | null> => {
  const query = `query {
    Socials(input: { filter: { dappName: { _eq: farcaster }, profileName: { _eq: "${username}" } }, blockchain: ethereum }) {
      Social {
        connectedAddresses {
          address
          blockchain
          chainId
          timestamp
        }
      }
    }
  }`;

  const response = await fetch("https://api.airstack.xyz/gql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.AIRSTACK_API_KEY!,
    },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  if (data.Socials && data.Socials.Social.length > 0 && data.Socials.Social[0].connectedAddresses.length > 0) {
    return data.Socials.Social[0].connectedAddresses[0].address;
  }
  return null;
};


const getUserFollowingsForAddress = async (address: string): Promise<Following[]> => {
  const query = `query {
    Farcaster: SocialFollowings(input: { filter: { identity: { _in: ["${address}"] }, dappName: { _eq: farcaster } }, blockchain: ALL }) {
      Following {
        followingAddress {
          socials(input: { filter: { dappName: { _eq: farcaster } } }) {
            profileName
            dappName
          }
        }
      }
    }
  }`;

  const response = await fetch("https://api.airstack.xyz/gql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.AIRSTACK_API_KEY!,
    },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  return data.Farcaster.Following || [];
};

const getAllNFTsForAddress = async (address: string, client: CovalentClient): Promise<NFTData[]> => {
  const resp = await client.NftService.getNftsForAddress("base-mainnet", address, { withUncached: true });
  return resp.data?.items || [];
};

const getAllTokensForAddress = async (address: string, client: CovalentClient): Promise<TokenData[]> => {
  const resp = await client.BalanceService.getTokenBalancesForWalletAddress("base-mainnet", address);
  return resp.data?.items || [];
};

const calculateArraySimilarity = (array1: any[], array2: any[]): { similarity: number, common: any[] } => {
  if (!array1.length || !array2.length) return { similarity: 0, common: [] };
  const set1 = new Set(array1);
  const set2 = new Set(array2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const intersectionArray = Array.from(intersection);
  return {
    similarity: (intersectionArray.length / Math.max(set1.size, set2.size)) * 100,
    common: intersectionArray,
  };
};

export const calculateSimilarity = async (fid: string, secondaryUsername: string): Promise<number> => {
  if (similarityScores[fid] !== undefined) {
    similarityScores[fid] = null;
    console.log(`Similarity score set to null for fid: ${fid}`);
  }

  const primaryAddressPromise = getUserAddressFromFID(fid);
  const secondaryAddressPromise = getUserAddressFromFCUsername(secondaryUsername);


  const [primaryAddress, secondaryAddress] = await Promise.all([primaryAddressPromise, secondaryAddressPromise]);

  console.log(primaryAddress, secondaryAddress);


  if (!primaryAddress || !secondaryAddress) {
    console.error("One or both usernames did not resolve to addresses.");
    return 0;
  }

  const client = new CovalentClient(`${process.env.COVALENT_API_KEY}`);

  const primaryDataPromises = [
    getAllNFTsForAddress(primaryAddress, client),
    getAllTokensForAddress(primaryAddress, client),
    getUserFollowingsForAddress(primaryAddress)
  ];

  const secondaryDataPromises = [
    getAllNFTsForAddress(secondaryAddress, client),
    getAllTokensForAddress(secondaryAddress, client),
    getUserFollowingsForAddress(secondaryAddress)
  ];

  const [
    [primaryNftData, primaryTokenData, primaryFollowingData],
    [secondaryNftData, secondaryTokenData, secondaryFollowingData]
  ] = await Promise.all([Promise.all(primaryDataPromises), Promise.all(secondaryDataPromises)]);

  const primaryNfts = (primaryNftData as NFTData[]).map(item => item.nft_data?.[0]?.external_data?.image).filter(image => image);
  const secondaryNfts = (secondaryNftData as NFTData[]).map(item => item.nft_data?.[0]?.external_data?.image).filter(image => image);

  const primaryTokens = (primaryTokenData as TokenData[]).map(item => item.contract_ticker_symbol);
  const secondaryTokens = (secondaryTokenData as TokenData[]).map(item => item.contract_ticker_symbol);

  const primaryFollowings = primaryFollowingData.map(following => {
    if ('followingAddress' in following && following.followingAddress) {
      return following.followingAddress.socials[0]?.profileName;
    }
    return null;
  }).filter(name => name);
  const secondaryFollowings = secondaryFollowingData.map(following => {
    if ('followingAddress' in following && following.followingAddress) {
      return following.followingAddress.socials[0]?.profileName;
    }
    return null;
  }).filter(name => name);

  const nftSimilarityResult = calculateArraySimilarity(primaryNfts, secondaryNfts);
  console.log(`NFT similarity: ${nftSimilarityResult.similarity}`);

  const tokenSimilarityResult = calculateArraySimilarity(primaryTokens, secondaryTokens);
  console.log(`Token similarity: ${tokenSimilarityResult.similarity}`);

  const followingSimilarityResult = calculateArraySimilarity(primaryFollowings, secondaryFollowings);
  console.log(`Following similarity: ${followingSimilarityResult.similarity}`);

  const validSimilarities = [nftSimilarityResult.similarity, tokenSimilarityResult.similarity, followingSimilarityResult.similarity].filter(similarity => similarity > 0);
  const similarityScore = validSimilarities.length ? validSimilarities.reduce((a, b) => a + b) / validSimilarities.length : 0;

  console.log(`Similarity score: ${similarityScore}`);

  similarityScores[fid] = similarityScore;

  return similarityScore;
};

export const getSimilarityScore = async (fid: string): Promise<number | null> => {
  return similarityScores[fid] !== undefined ? similarityScores[fid] : null;
};
