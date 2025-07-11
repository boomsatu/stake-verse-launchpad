import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, base, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'TokenDApp',
  projectId: 'YOUR_PROJECT_ID', // Get this from https://cloud.walletconnect.com
  chains: [mainnet, polygon, arbitrum, base, sepolia],
  ssr: false,
});

// For development purposes, we'll use sepolia testnet
export const defaultChain = sepolia;