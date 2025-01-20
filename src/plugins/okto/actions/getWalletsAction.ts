import { Action, elizaLogger, HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { handleApiError, validateSearchQuery } from "../utils.ts";
import { OktoSDKPlugin } from "../index.ts";
import { Wallet } from "../types.ts";

function prettyPrintWallets(wallets: Wallet[]) : string {
    if (!wallets || wallets.length === 0) {
        return "No wallets found.";
    }
    
    return wallets
        .map((wallet, index) => 
            `${index + 1}. ${wallet.network_name} → ${wallet.address}`)
        .join('\n');
}

export const getWalletsAction = (plugin: OktoSDKPlugin): Action => {
    return {
      name: "OKTO_GET_WALLETS",
      description: "Get Okto Wallets",
      examples: [
        [
          {
            user: "user",
            content: { text: "get okto wallets" },
          },
        ],
        [
          {
            user: "user",
            content: { text: "show me my okto wallets" },
          },
        ],
        [
          {
            user: "user",
            content: { text: "fetch my okto wallets" },
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
            // console.log("wallets: ", wallets)

            callback(
                  {
                    text: `✅ Okto Wallets: \n${prettyPrintWallets(wallets.wallets)}`,
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