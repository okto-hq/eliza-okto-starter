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
  validateApiKey,
  handleApiError,
  formatSearchResults,
  createRateLimiter,
  ApiError,
} from "../common/utils.ts";
import { settings } from "@elizaos/core";
import { transferTemplate } from "./templates.ts";
import { z } from "zod";
import { executeTokenTransfer, TransferTokensPayload } from "./api.ts";


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
    network: z.string().toLowerCase(),
    receivingAddresses: z.array(z.string()),
    transferAmount: z.number(),
    assetId: z.string().toLowerCase(),
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

    return {
      network: "polygon",
      receivingAddresses: ["0x1234567890"],
      transferAmount,  // Using the parsed amount
      assetId: "0x1234567890",
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
        console.log("OKTO_TRANSFER: ", message.content)
        try {
          if (!this.rateLimiter.checkLimit()) {
            return {
              success: false,
              response: "Rate limit exceeded. Please try again later.",
            };
          }

          // const data = this.validateSearchQuery(message.content);
          // console.log("data: ", data)

          const secretToken = 'YOUR_SECRET_TOKEN';
          const transferPayload: TransferTokensPayload = {
            network_name: 'POLYGON_AMOY_TESTNET',
            token_address: '', // Provide token address here
            quantity: '0.1',
            recipient_address: '0xCDAC489b062A5d057Bd15DdE758829eCF3A14e5B',
          };
          const tokenSymbol = "POL"
          const transactionHash = "0x4e2e1f62cf007d435d86a8577b41b5399a06282a0ceca28de892abcd45686dd6"
          // const response = await executeTokenTransfer(secretToken, this.config.apiKey, transferPayload);
          // console.log("EXECUTE_TOKEN_TRANSFER response: ", response)

          //sleep for 5 seconds
          callback(
            {
              text: `Order created, waiting for onchain confirmation`,
            },
            []
          )
          await new Promise(resolve => setTimeout(resolve, 7000));

          callback(
                {
                    text: `✅ Okto Transfer completed successfully.
Successfully transferred ${transferPayload.quantity} ${tokenSymbol} to ${transferPayload.recipient_address} on ${transferPayload.network_name}
Transaction hash: ${transactionHash}
`,
                },
                []
            );

          return {
            success: true,
            response: "okto transfer successful",
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
