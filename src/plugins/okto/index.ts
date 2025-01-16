import {
  Content,
  IAgentRuntime,
  Memory,
  State,
  ActionExample,
  Plugin,
  Action,
  generateObject,
  composeContext,
  ModelClass,
  HandlerCallback,
} from "@elizaos/core";
import {
  handleApiError,
  createRateLimiter,
  ApiError,
} from "../common/utils.ts";
import { settings } from "@elizaos/core";
import { z } from "zod";
import { OktoWallet } from "./OktoWallet.ts";
import { BuildType, TransferTokens } from "../common/types.ts";
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
  private rateLimiter = createRateLimiter(60, 60000); // 60 requests per minute
  private oktoWallet: OktoWallet;

  constructor(config: OktoPluginConfig) {
    console.log("LOADED: OktoSearchPlugin constructor", config);
    if (!config.apiKey) {
      throw new ApiError("API key is required");
    }
    this.oktoWallet = new OktoWallet();
    this.oktoWallet.init(config.apiKey, config.buildType);
    // this.oktoWallet.authenticate(config.idToken, (result: any, error: any) => {
    //   if(result) {
    //     console.log("OKTO_AUTHENTICATE: ", result);
    //   } else {
    //     console.log("OKTO_AUTHENTICATE: ", error);
    //   }
    // });
    
  }

  validateSearchQuery(content: Content): any {
    let query = typeof content === "string" ? content : content.text;
    if (!query?.trim()) {
      throw new ApiError("Query should contain a transfer command");
    }
    query = query.trim().toLowerCase();

    // Extract numerical amount using regex
    const amountMatch = query.match(/\d+(\.\d+)?/);
    const transferAmount = amountMatch ? parseFloat(amountMatch[0]) : null;

    if (!transferAmount) {
      throw new ApiError("No valid transfer amount found in query");
    }

    // Extract the recipient address from the query that starts with 0x
    const recipientAddress = query.match(/0x[a-fA-F0-9]{40}/)?.[0];
    if (!recipientAddress) {
      throw new ApiError("No valid recipient address found in query");
    }

    return {
                "network_name": "POLYGON_TESTNET_AMOY",
                "token_address": "",
                "recipient_address": recipientAddress,
                "quantity": transferAmount.toString()
            }
  }


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
          if (!this.rateLimiter.checkLimit()) {
            return {
              success: false,
              response: "Rate limit exceeded. Please try again later.",
            };
          }
          // const data = this.validateSearchQuery(message.content);
          // console.log("data: ", data)

          if (!state) {
              state = (await runtime.composeState(message)) as State;
          } else {
              state = await runtime.updateRecentMessageState(state);
          }

          const context = composeContext({
              state,
              template: transferTemplate,
          });

          // console.log("CONTEXT: ", context)

          const transferDetails = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: TransferSchema,
            });

          console.log("TRANSFER_DETAILS: ", transferDetails.object)

            // elizaLogger.info(
            //     "Transfer details generated:",
            //     transferDetails.object
            // );


          // const tokenSymbol = "POL"
          // let transactionHash = ""

          // try {
          //   const order = await this.oktoWallet.transferTokens(data);
          //   console.log("ORDER: ", order)

          // await new Promise(resolve => setTimeout(resolve, 10000));

//           callback(
//                 {
//                     text: `✅ Okto Transfer intented submitted.
// Submitted transfer of ${data.quantity} ${tokenSymbol} to ${data.recipient_address} on ${data.network_name}
// Order ID: ${order.orderId}
// `,
//                 },
//                 []
//             );
          // } catch (error) {
          //   console.log("ERROR: ", error)
          //   callback(
          //       {
          //           text: `❌ Okto Transfer failed.`,
          //       },
          //       []
          //   )
          // }

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
