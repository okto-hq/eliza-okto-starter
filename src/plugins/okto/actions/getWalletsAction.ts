import { Action, composeContext, elizaLogger, generateObject, HandlerCallback, IAgentRuntime, Memory, ModelClass, State } from "@elizaos/core";
import { transferTemplate } from "../templates.ts";
import { z } from "zod";
import { handleApiError, validateSearchQuery } from "../../common/utils.ts";
import { OktoSDKPlugin } from "../index.ts";

export const getWalletsAction = (plugin: OktoSDKPlugin): Action => {
    return {
      name: "OKTO_GET_WALLETS",
      description: "Get Okto Wallets",
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
        [
          {
            user: "user",
            content: { text: "transfer 0.01 POL to 0xF638D541943213D42751F6BFa323ebe6e0fbEaA1 on Polygon amoy testnet" },
          },
        ],
      ],
      similes: ["OKTO_GET_WALLETS", "GET_WALLETS", "WALLETS", "FETCH_WALLETS", "FETCH_OKTO_WALLETS"],
      suppressInitialMessage: true,
      
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
        options?: any,
        callback?: HandlerCallback
      ) => {
        try {
          validateSearchQuery(message.content);

          try {
            const wallets = await plugin.oktoWallet.getWallets();
            console.log("wallets: ", wallets)

            callback(
                  {
                    text: `✅ Okto Wallets: ${JSON.stringify(wallets)}`,
                  },
                  []
              );
            } catch (error) {
              elizaLogger.error("Okto Get Wallets failed: ", error.message)
              callback(
                  {
                      text: `❌ Okto Get Wallets failed.`,
                  },
                  []
              )
            }

            return {
              success: true,
              response: "okto get wallets successful",
            };
          } catch (error) {
            console.log("ERROR: ", error)
            return handleApiError(error);
          }
        },
    }
}