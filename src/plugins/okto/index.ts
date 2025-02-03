import {
  Plugin,
  Action,
  elizaLogger
} from "@elizaos/core";
import {
  ApiError,
} from "./utils.ts";
import { settings } from "@elizaos/core";
import { OktoClient, OktoClientConfig } from '@okto_web3/core-js-sdk';
// import { transferTokensAction } from "./actions/transferTokensAction.ts";
// import { getWalletsAction } from "./actions/getWalletsAction.ts";
// import { getPortfolioAction } from "./actions/getPortfolioAction.ts";
// import { orderHistoryAction } from "./actions/orderHistoryAction.ts";
// import { swapTokenAction } from "./actions/swapTokenAction.ts";
import { getGoogleIdToken } from "./google.ts";


export class OktoPlugin implements Plugin {
  readonly name: string = "okto";
  readonly description: string = "Interface web3 with Okto API";
  public oktoClient: OktoClient;

  constructor() {
    const environment = settings.OKTO_ENVIRONMENT || "sandbox";
    const vendorPrivKey = settings.OKTO_VENDOR_PRIVATE_KEY;
    if (!vendorPrivKey) {
      throw new Error("OKTO_VENDOR_PRIVATE_KEY is required for OktoPlugin and is not set");
    }
    const vendorSWA = settings.OKTO_VENDOR_SWA;
    if (!vendorSWA) {
      throw new Error("OKTO_VENDOR_SWA is required for OktoPlugin and is not set");
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
      vendorPrivKey: vendorPrivKey as any,
      vendorSWA: vendorSWA as any,
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
  }

  actions: Action[] = [
    // getPortfolioAction(this),
    // transferTokensAction(this),
    // getWalletsAction(this),
    // orderHistoryAction(this),
    // swapTokenAction(this),
  ];
}
export default new OktoPlugin();