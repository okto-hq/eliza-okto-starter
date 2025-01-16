import {
  Content,
  IAgentRuntime,
  Memory,
  State,
  Plugin,
  Action,
  generateObject,
  composeContext,
  ModelClass,
  HandlerCallback,
  elizaLogger
} from "@elizaos/core";
import {
  handleApiError,
  ApiError,
} from "../common/utils.ts";
import { settings } from "@elizaos/core";
import { z } from "zod";
import { OktoWallet } from "./OktoWallet.ts";
import { BuildType } from "../common/types.ts";
import { transferTemplate } from "./templates.ts";


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

export const TransferSchema = z.object({
    network: z.string().toUpperCase(),
    receivingAddress: z.string(),
    transferAmount: z.number(),
    assetId: z.string().toUpperCase(),
});

export class OktoSearchPlugin implements OktoPlugin {
  readonly name: string = "okto";
  readonly description: string = "Interface web3 with Okto API";
  config: OktoPluginConfig;
  private oktoWallet: OktoWallet;

  constructor(config: OktoPluginConfig) {
    console.log("LOADED: OktoSearchPlugin constructor", config);
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

  validateSearchQuery(content: Content): any {
    let query = typeof content === "string" ? content : content.text;
    if (!query?.trim()) {
      throw new ApiError("Query should contain a transfer command");
    }
    query = query.trim().toLowerCase();
    return query;
  }

  isTransferContent(object: any): object is z.infer<typeof TransferSchema> {
      return TransferSchema.safeParse(object).success;
  };


  actions: Action[] = [
    {
      name: "OKTO_TRANSFER",
      description: "Perform Token transfers using okto",
      examples: [
        [
          {
            user: "user",
            content: { text: "transfer 1 SOL to winner.sol on solana" },
          },
        ],
        [
          {
            user: "user",
            content: { text: "send 1 eth token to 0x1234567890 on polygon" },
          },
        ],
      ],
      similes: ["TRANSFER", "TOKEN_TRANSFER", "OKTO_TRANSFER", "OKTO_SEND", "SEND_TOKEN"],
      
      validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
      ) => {
        try {
          this.validateSearchQuery(message.content);
          return true;
        } catch {
          return false;
        }
      },

      handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
      ) => {
        try {
          this.validateSearchQuery(message.content);

          if (!state) {
              state = (await runtime.composeState(message)) as State;
          } else {
              state = await runtime.updateRecentMessageState(state);
          }

          const context = composeContext({
              state,
              template: transferTemplate,
          });

          const transferDetails = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: TransferSchema,
            });

          const transferObject = transferDetails.object as z.infer<typeof TransferSchema>;
          elizaLogger.info("OKTO Token Transfer Details: ", transferObject)
          const tokenSymbol = "POL"
          const data ={
                "network_name": transferObject.network,
                "token_address": "", //TODO get the actual token address from symbol
                "recipient_address": transferObject.receivingAddress,
                "quantity": transferObject.transferAmount.toString()
          }

          if (!this.isTransferContent(transferDetails.object)) {
                callback(
                    {
                        text: "Invalid transfer details. Please check the inputs.",
                    },
                    []
                );
                return;
            }

          let transactionHash = "" // TODO: get transaction hash from okto

          try {
            const order = await this.oktoWallet.transferTokens(data);
            elizaLogger.info("ORDER: ", order)

            await new Promise(resolve => setTimeout(resolve, 10000));

            callback(
                  {
                    text: `✅ Okto Transfer intented submitted.
Submitted transfer of ${data.quantity} ${tokenSymbol} to ${data.recipient_address} on ${data.network_name}
Order ID: ${order.orderId}
`,
                  },
                  []
              );
            } catch (error) {
              elizaLogger.error("Okto Transfer failed: ", error.message)
              callback(
                  {
                      text: `❌ Okto Transfer failed.`,
                  },
                  []
              )
            }

            return {
              success: true,
              response: "okto transfer successful",
            };
          } catch (error) {
            console.log("ERROR: ", error)
            return handleApiError(error);
          }
        },
      },
    ];
}
export default new OktoSearchPlugin({
  apiKey: settings.OKTO_API_KEY || "",
  buildType: settings.OKTO_BUILD_TYPE as BuildType || BuildType.SANDBOX,
  idToken: settings.OKTO_GOOGLE_ID_TOKEN || "",
});
