import { Action, elizaLogger, HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { handleApiError, validateSearchQuery } from "../utils.ts";
import { OktoSDKPlugin } from "../index.ts";
import { OrderData } from "../types.ts";

function prettyPrintOrderHistory(orders: OrderData) : string {
    if (!orders || orders.jobs.length === 0) {
        return "No orders found in order history.";
    }
    //sorted order by latest updated at
    orders.jobs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return orders.jobs
        .map((order, index) => {
            const baseInfo = `${index + 1}. Order ID: ${order.order_id} (${order.network_name})\n` +
                          `   • Order Type: ${order.order_type}\n` +
                          `   • Status: ${order.status}\n` +
                          `   • Created At: ${order.created_at}\n` +
                          `   • Updated At: ${order.updated_at}`;
            
            return order.transaction_hash 
                ? `${baseInfo}\n   • Transaction Hash: \`${order.transaction_hash}\`` 
                : baseInfo;
        })
        .join('\n\n');
}

export const orderHistoryAction = (plugin: OktoSDKPlugin): Action => {
    return {
      name: "OKTO_GET_ORDER_HISTORY",
      description: "Get Okto Order History",
      examples: [
        [
          {
            user: "user",
            content: { text: "get okto order history" },
          },
        ],
        [
          {
            user: "user",
            content: { text: "show me my okto order history" },
          },
        ],
        [
          {
            user: "user",
            content: { text: "fetch my okto order history" },
          },
        ],
      ],
      similes: ["OKTO_GET_ORDER_HISTORY", "GET_ORDER_HISTORY", "ORDER_HISTORY", "FETCH_ORDER_HISTORY", "FETCH_OKTO_ORDER_HISTORY"],
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
            const orders = await plugin.oktoWallet.orderHistory({});
            // console.log("orders: ", orders)

            callback(
                  {
                    text: `✅ Okto Order History: \n${prettyPrintOrderHistory(orders)}`,
                  },
                  []
              );
            } catch (error) {
              elizaLogger.error("Okto Get Order History failed: ", error.message)
              callback(
                  {
                      text: `❌ Okto Get Order History failed.`,
                  },
                  []
              )
            }

            return {
              success: true,
              response: "okto get order history successful",
            };
          } catch (error) {
            console.log("ERROR: ", error)
            return handleApiError(error);
          }
        },
    }
}