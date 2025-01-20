import {
  Plugin,
  Action,
  elizaLogger
} from "@elizaos/core";
import {
  ApiError,
} from "./utils.ts";
import { settings } from "@elizaos/core";
import { OktoWallet } from "./OktoWallet.ts";
import { BuildType } from "./types.ts";
import { transferTokensAction } from "./actions/transferTokensAction.ts";
import { getWalletsAction } from "./actions/getWalletsAction.ts";
import { getPortfolioAction } from "./actions/getPortfolioAction.ts";
import { orderHistoryAction } from "./actions/orderHistoryAction.ts";
import { getGoogleIdToken } from "./google.ts";

export interface OktoPlugin extends Plugin {
  name: string;
  description: string;
  actions: Action[];
  config: OktoPluginConfig;
}

export interface OktoPluginConfig {
  apiKey: string;
  buildType: BuildType;
  googleClientId: string;
  googleClientSecret: string;
  idToken?: string;
}

export class OktoSDKPlugin implements OktoPlugin {
  readonly name: string = "okto";
  readonly description: string = "Interface web3 with Okto API";
  config: OktoPluginConfig;
  public oktoWallet: OktoWallet;

  constructor(config: OktoPluginConfig) {
    if (!config.apiKey) {
      throw new ApiError("API key is required");
    }
    this.oktoWallet = new OktoWallet();
    this.oktoWallet.init(config.apiKey, config.buildType);
    
    getGoogleIdToken(config.googleClientId, config.googleClientSecret).then((tokens: any) => {
      elizaLogger.info("Google login success")
      this.oktoWallet.authenticate(tokens.id_token, (result: any, error: any) => {
        if(result) {
          elizaLogger.info("OKTO: authentication success")
        } else {
          elizaLogger.warn("OKTO: authenticatoin failure ", error.message)
        }
      });
    })
    
  }

  actions: Action[] = [
    transferTokensAction(this),
    getWalletsAction(this),
    getPortfolioAction(this),
    orderHistoryAction(this),
  ];
}
export default new OktoSDKPlugin({
  apiKey: settings.OKTO_API_KEY || "",
  buildType: settings.OKTO_BUILD_TYPE as BuildType || BuildType.SANDBOX,
  googleClientId: settings.GOOGLE_CLIENT_ID || "",
  googleClientSecret: settings.GOOGLE_CLIENT_SECRET || "",
  idToken: settings.OKTO_GOOGLE_ID_TOKEN || "",
});
