import { BuildType } from './types.ts';

export const baseUrls = {
  [BuildType.PRODUCTION]: 'https://apigw.okto.tech',
  [BuildType.STAGING]: 'https://3p-bff.oktostage.com',
  [BuildType.SANDBOX]: 'https://sandbox-api.okto.tech',
};

export const JOB_RETRY_INTERVAL = 5000; //5s
export const JOB_MAX_RETRY = 12; //retry for 60s (12 * 5 = 60)

export const NETWORK_TOKEN_ADDRESS = {
  APTOS: {
    APT: "0x1::aptos_coin::AptosCoin",
    USDT: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
  },
  APTOS_TESTNET: {
    APT_TESTNET: "0x1::aptos_coin::AptosCoin",
  },
  AVALANCHE: {
    AVAX: "",
  },
  BSC: {
    BNB: "",
    USDT: "0x55d398326f99059ff775485246999027b3197955",
  },
  LINEA: {
    ETH: "",
  },
  SCROLL: {
    ETH: "",
    USDC: "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4",
  },
  BASE: {
    ETH: "",
    USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  },
  POLYGON: {
    POL: "",
    USDC: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    USDT: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  },
  POLYGON_TESTNET_AMOY: {
    MATIC: "",
    POL: "",
    USDC: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
  },
  SOLANA: {
    SOL: "",
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  },
  SOLANA_DEVNET: {
    SOL_DEVNET: "",
    USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  },
  ZKEVM: {
    QUICK: "0x68286607a1d43602d880d349187c3c48c0fd05e6",
    WETH: "",
  },
  GNOSIS: {
    XDAI: "",
    USDT: "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
  },
  ETHEREUM: {
    WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  OPTIMISM: {
    WETH: "",
  },
  ARBITRUM: {
    WETH: "",
  },
};

export const SUPPORTED_NETWORKS = Object.keys(NETWORK_TOKEN_ADDRESS);
export const SUPPORTED_TOKENS = [...new Set(
  Object.values(NETWORK_TOKEN_ADDRESS)
    .flatMap(networkTokens => Object.keys(networkTokens))
)];