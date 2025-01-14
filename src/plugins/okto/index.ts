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
} from "@elizaos/core";
import {
  validateApiKey,
  validateSearchQuery,
  handleApiError,
  formatSearchResults,
  createRateLimiter,
  ApiError,
} from "../common/utils.ts";
import { settings } from "@elizaos/core";
import { transferTemplate } from "./templates.ts";
import { z } from "zod";


export interface OktoPlugin extends Plugin {
  name: string;
  description: string;
  actions: Action[];
  config: OktoPluginConfig;
}

export interface OktoPluginConfig {
  apiKey: string;
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

  constructor(config: OktoPluginConfig) {
    console.log("LOADED: OktoSearchPlugin constructor", config);
    if (!config.apiKey) {
      throw new ApiError("API key is required");
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
          validateSearchQuery(message.content);
          return true;
        } catch {
          return false;
        }
      },

      handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
      ) => {
        console.log("OKTO_TRANSFER: ", message.content)
        try {
          if (!this.rateLimiter.checkLimit()) {
            return {
              success: false,
              response: "Rate limit exceeded. Please try again later.",
            };
          }

          // if (!state) {
          //       state = (await runtime.composeState(message, {
          //           providers: [massPayoutProvider],
          //       })) as State;
          // } else {
          //     state = await runtime.updateRecentMessageState(state);
          // }

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

            console.log(
                "Transfer details generated:",
                transferDetails.object
            );

          const query = validateSearchQuery(message.content);

          const results = [{
            title: "OKTO_TRANSFER",
            url: "OKTO_TRANSFER",
            snippet: "OKTO_TRANSFER",
            source: "okto",
          }];

          return {
            success: true,
            response: "okto transfer successful hash: 12121",
          };
        } catch (error) {
          return handleApiError(error);
        }
      },
    },
  ];
}
export default new OktoSearchPlugin({
  apiKey: settings.TAVILY_API_KEY || "",
});
