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

export interface OktoPlugin extends Plugin {
  name: string;
  description: string;
  actions: Action[];
  config: OktoPluginConfig;
}

export interface OktoPluginConfig {
  environment: string;
  vendorPrivKey: string;
  vendorSWA: string;
  googleClientId: string;
  googleClientSecret: string;
}

export class OktoSDKPlugin implements OktoPlugin {
  readonly name: string = "okto";
  readonly description: string = "Interface web3 with Okto API";
  config: OktoPluginConfig;
  public oktoClient: OktoClient;
;

  constructor(config: OktoPluginConfig) {
    const clientConfig: OktoClientConfig = {
      environment: config.environment as any,
      vendorPrivKey: config.vendorPrivKey as any,
      vendorSWA: config.vendorSWA as any,
    }
    this.oktoClient = new OktoClient(clientConfig);
    
    getGoogleIdToken(config.googleClientId, config.googleClientSecret).then(async (tokens: any) => {
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
    // transferTokensAction(this),
    // getWalletsAction(this),
    // getPortfolioAction(this),
    // orderHistoryAction(this),
    // swapTokenAction(this),
  ];
}
export default new OktoSDKPlugin({
  environment: settings.OKTO_ENVIRONMENT || "sandbox",
  vendorPrivKey: settings.OKTO_VENDOR_PRIVATE_KEY || "", // todo: throw error if not set
  vendorSWA: settings.OKTO_VENDOR_SWA || "",
  googleClientId: settings.GOOGLE_CLIENT_ID || "",
  googleClientSecret: settings.GOOGLE_CLIENT_SECRET || "",
});
