export enum BuildType {
  STAGING = 'STAGING',
  SANDBOX = 'SANDBOX',
  PRODUCTION = 'PRODUCTION',
}

export enum OrderStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}


export interface ApiResponse<T> {
  data: T;
  status: string;
}

export type Callback<T> = (result: T | null, error: Error | null) => void;

export interface AuthDetails {
  authToken: string;
  refreshToken: string;
  deviceToken: string;
}

export interface Network {
  network_name: string;
  chain_id: string;
}

export interface NetworkData {
  network: Network[];
}

export interface NftOrderDetailsQuery {
  page: number;
  size: number;
  order_id: string;
}

export interface NftOrderDetails {
  explorer_smart_contract_url: string;
  description: string;
  type: string;
  collection_id: string;
  collection_name: string;
  nft_token_id: string;
  token_uri: string;
  id: string;
  image: string;
  collection_address: string;
  collection_image: string;
  network_name: string;
  network_id: string;
  nft_name: string;
}

export interface NftOrderDetailsData {
  count: number;
  nfts: NftOrderDetails[];
}

export interface OrderQuery {
  offset: number;
  limit: number;
  order_id: string;
  order_state: string;
}

export interface Order {
  order_id: string;
  network_name: string;
  order_type: string;
  status: string;
  transaction_hash: string;
  created_at: string;
  updated_at: string;
}

export interface OrderData {
  total: number;
  jobs: Order[];
}

export interface Portfolio {
  token_name: string;
  token_image: string;
  token_address: string;
  network_name: string;
  quantity: string;
  amount_in_inr: string;
}

export interface PortfolioData {
  tokens: Portfolio[];
  total: number;
}

export interface Token {
  token_name: string;
  token_address: string;
  network_name: string;
}

export interface TokensData {
  tokens: Token[];
}

export interface User {
  email: string;
  user_id: string;
  created_at: string;
  freezed: string;
  freeze_reason: string;
}

export interface Wallet {
  network_name: string;
  address: string;
  success: boolean;
}

export interface WalletData {
  wallets: Wallet[];
}

export interface RawTransactionStatusQuery {
  order_id: string;
}

export interface RawTransactionStatus {
  order_id: string;
  network_name: string;
  status: string;
  transaction_hash: string;
}

export interface RawTransactionStatusData {
  total: number;
  jobs: RawTransactionStatus[];
}

export interface TransferTokens {
  network_name: string;
  token_address: string;
  quantity: string;
  recipient_address: string;
}

export interface TransferTokensData {
  orderId: string;
}

export interface TransferNft {
  operation_type: string;
  network_name: string;
  collection_address: string;
  collection_name: string;
  quantity: string;
  recipient_address: string;
  nft_address: string;
}

export interface TransferNftData {
  order_id: string;
}

export interface ExecuteRawTransaction {
  network_name: string;
  transaction: object;
}

export interface ExecuteRawTransactionData {
  jobId: string;
}