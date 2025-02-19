import {
    elizaLogger,
    IAgentRuntime,
    Service,
    ServiceType,
    settings
} from "@elizaos/core";
import { OktoClient, OktoClientConfig } from "@okto_web3/core-js-sdk";
import { getGoogleIdToken } from "../google.ts";
import { getPortfolio, getAccount, getChains, getNftCollections, getOrdersHistory, getPortfolioNFT, getTokens } from "@okto_web3/core-js-sdk/explorer";
import { GetSupportedNetworksResponseData, Order, UserNFTBalance, UserPortfolioData } from "@okto_web3/core-js-sdk/types";
import { tokenTransfer, nftTransfer, evmRawTransaction } from "@okto_web3/core-js-sdk/userop";
import { NFTTransferIntentParams, RawTransactionIntentParams, TokenTransferIntentParams, Token, Wallet } from "../types.ts";

export class OktoService extends Service {
    static serviceType: ServiceType = ServiceType.TRANSCRIPTION;
    private oktoClient: OktoClient;

    initialize(runtime: IAgentRuntime): Promise<void> {
        const environment = settings.OKTO_ENVIRONMENT || "sandbox";
        const clientPrivateKey = settings.OKTO_CLIENT_PRIVATE_KEY;
        if (!clientPrivateKey) {
            throw new Error("OKTO_CLIENT_PRIVATE_KEY is required for OktoPlugin and is not set");
        }
        const clientSWA = settings.OKTO_CLIENT_SWA;
        if (!clientSWA) {
            throw new Error("OKTO_CLIENT_SWA is required for OktoPlugin and is not set");
        }
        const googleClientId = settings.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            throw new Error("GOOGLE_CLIENT_ID is required for OktoPlugin and is not set");
        }
        const googleClientSecret = settings.GOOGLE_CLIENT_SECRET;
        if (!googleClientSecret) {
            throw new Error("GOOGLE_CLIENT_SECRET is required for OktoPlugin and is not set");
        }

        const clientConfig: OktoClientConfig = {
            environment: environment as any,
            clientPrivateKey: clientPrivateKey as any,
            clientSWA: clientSWA as any,
        }
        this.oktoClient = new OktoClient(clientConfig);
        
        getGoogleIdToken(googleClientId, googleClientSecret).then(async (tokens: any) => {
            try {
                const user = await this.oktoClient.loginUsingOAuth({
                idToken: tokens.id_token,
                provider: 'google',
                });
                elizaLogger.info("Okto Authenticateion Success", JSON.stringify(user, null, 2));
            } catch (error: any) {
                elizaLogger.error("Okto Authenticateion Error", error.message);
            }
        })
        return Promise.resolve();
    }

  async getPortfolio(): Promise<UserPortfolioData> {
    return await getPortfolio(this.oktoClient);
  }

  async getAccount(): Promise<Wallet[]> {
    return await getAccount(this.oktoClient);
  }

  async getChains(): Promise<GetSupportedNetworksResponseData[]> {
    return await getChains(this.oktoClient);
  }

  async getNftCollections(): Promise<Order[]> {
    return await getNftCollections(this.oktoClient);
  }

  async getOrdersHistory(): Promise<Order[]> {
    return await getOrdersHistory(this.oktoClient);
  }

  async getPortfolioNFT(): Promise<UserNFTBalance[]> {
    return await getPortfolioNFT(this.oktoClient);
  }

  async getTokens(): Promise<Token[]> {
    return await getTokens(this.oktoClient);
  }

  async tokenTransfer(params: TokenTransferIntentParams): Promise<string> {
    const userOp = await tokenTransfer(this.oktoClient, params);
    const signedUserOp = await this.oktoClient.signUserOp(userOp);
    const tx = await this.oktoClient.executeUserOp(signedUserOp);
    return tx;
  }

  async nftTransfer(params: NFTTransferIntentParams): Promise<string> {
    const userOp = await nftTransfer(this.oktoClient, params);
    const signedUserOp = await this.oktoClient.signUserOp(userOp);
    const tx = await this.oktoClient.executeUserOp(signedUserOp);
    return tx;
  }

  async evmRawTransaction(params: RawTransactionIntentParams): Promise<string> {
    const userOp = await evmRawTransaction(this.oktoClient, params);
    const signedUserOp = await this.oktoClient.signUserOp(userOp);
    const tx = await this.oktoClient.executeUserOp(signedUserOp);
    return tx;
  }

    
}
