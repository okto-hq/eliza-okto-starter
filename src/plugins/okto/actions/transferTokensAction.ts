import { Action, composeContext, elizaLogger, generateObject, HandlerCallback, IAgentRuntime, Memory, ModelClass, State } from "@elizaos/core";
import { transferTemplate } from "../templates.ts";
import { z } from "zod";
import { getTokenAddress, handleApiError, validateSearchQuery } from "../utils.ts";
import { OktoSDKPlugin } from "../index.ts";

export const TransferSchema = z.object({
    network: z.string().toUpperCase(),
    receivingAddress: z.string(),
    transferAmount: z.number(),
    assetId: z.string().toUpperCase(),
});


function isTransferContent(object: any): object is z.infer<typeof TransferSchema> {
    return TransferSchema.safeParse(object).success;
};


export const transferTokensAction = (plugin: OktoSDKPlugin): Action => {
    return {
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
        [
          {
            user: "user",
            content: { text: "transfer 0.01 POL to 0xF638D541943213D42751F6BFa323ebe6e0fbEaA1 on Polygon amoy testnet" },
          },
        ],
      ],
      similes: ["TRANSFER", "TOKEN_TRANSFER", "OKTO_TRANSFER", "OKTO_SEND", "SEND_TOKEN"],
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
                modelClass: ModelClass.SMALL,
                schema: TransferSchema,
                mode: "auto"
            });

          const transferObject = transferDetails.object as z.infer<typeof TransferSchema>;
          elizaLogger.info("OKTO Token Transfer Details: ", transferObject)
          let tokenAddress = ""
          try {
            tokenAddress = getTokenAddress(transferObject.network, transferObject.assetId)
          } catch (error) {
            elizaLogger.error("Error getting token address: ", error)
            callback(
                {
                    text: "Invalid token symbol. Please check the inputs.",
                },
                []
            )
          }
          const data ={
                "network_name": transferObject.network,
                "token_address": tokenAddress,
                "recipient_address": transferObject.receivingAddress,
                "quantity": transferObject.transferAmount.toString()
          }

          if (!isTransferContent(transferDetails.object)) {
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
            const order = await plugin.oktoWallet.transferTokens(data);
            elizaLogger.info("ORDER: ", order)

            await new Promise(resolve => setTimeout(resolve, 10000));

            callback(
                  {
                    text: `✅ Okto Transfer intented submitted.
Submitted transfer of ${data.quantity} ${transferObject.assetId} to ${data.recipient_address} on ${data.network_name}
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
    }
}