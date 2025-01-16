import {
  Plugin,
  Action,
  elizaLogger
} from "@elizaos/core";
import {
  ApiError,
} from "../common/utils.ts";
import { settings } from "@elizaos/core";
import { OktoWallet } from "./OktoWallet.ts";
import { BuildType } from "../common/types.ts";
import { transferTokensAction } from "./actions/transferTokensAction.ts";
import { getWalletsAction } from "./actions/getWalletsAction.ts";
import { getPortfolioAction } from "./actions/getPortfolioAction.ts";


export interface OktoPlugin extends Plugin {
  name: string;
  description: string;
  actions: Action[];
  config: OktoPluginConfig;
}

export interface OktoPluginConfig {
  apiKey: string;
  buildType: BuildType;
  idToken: string;
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
    this.oktoWallet.authenticate(config.idToken, (result: any, error: any) => {
      if(result) {
        elizaLogger.info("OKTO: authentication success")
      } else {
        elizaLogger.warn("OKTO: authenticatoin failure ", error.message)
      }
    });
    
  }
  

  actions: Action[] = [
    transferTokensAction(this),
    getWalletsAction(this),
    getPortfolioAction(this),
  ];
}
export default new OktoSDKPlugin({
  apiKey: settings.OKTO_API_KEY || "",
  buildType: settings.OKTO_BUILD_TYPE as BuildType || BuildType.SANDBOX,
  idToken: settings.OKTO_GOOGLE_ID_TOKEN || "",
});
