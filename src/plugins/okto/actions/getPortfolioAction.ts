import { Action, elizaLogger, HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { handleApiError, validateSearchQuery } from "../utils.ts";
import { OktoSDKPlugin } from "../index.ts";
import { PortfolioData } from "../types.ts";

function prettyPrintPortfolio(portfolio: PortfolioData) : string {
    if (!portfolio || portfolio.tokens.length === 0) {
        return "No tokens found in portfolio.";
    }
    
    return portfolio.tokens
        .map((token, index) => {
            const baseInfo = `${index + 1}. ${token.token_name} (${token.network_name})\n` +
                           `   • Quantity: ${token.quantity}`;
            
            return token.token_address 
                ? `${baseInfo}\n   • Address: \`${token.token_address}\`` 
                : baseInfo;
        })
        .join('\n\n');
}

export const getPortfolioAction = (plugin: OktoSDKPlugin): Action => {
    return {
      name: "OKTO_GET_PORTFOLIO",
      description: "Get Okto Portfolio",
      examples: [
        [
          {
            user: "user",
            content: { text: "get okto portfolio" },
          },
        ],
        [
          {
            user: "user",
            content: { text: "show me my okto portfolio" },
          },
        ],
        [
          {
            user: "user",
            content: { text: "fetch my okto portfolio" },
          },
        ],
      ],
      similes: ["OKTO_GET_PORTFOLIO", "GET_PORTFOLIO", "PORTFOLIO", "FETCH_PORTFOLIO", "FETCH_OKTO_PORTFOLIO"],
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
            const portfolio = await plugin.oktoWallet.getPortfolio();
            // console.log("portfolio: ", portfolio)

            callback(
                  {
                    text: `✅ Okto Portfolio: \n${prettyPrintPortfolio(portfolio)}`,
                  },
                  []
              );
            } catch (error) {
              elizaLogger.error("Okto Get Portfolio failed: ", error.message)
              callback(
                  {
                      text: `❌ Okto Get Portfolio failed.`,
                  },
                  []
              )
            }

            return {
              success: true,
              response: "okto get portfolio successful",
            };
          } catch (error) {
            console.log("ERROR: ", error)
            return handleApiError(error);
          }
        },
    }
}