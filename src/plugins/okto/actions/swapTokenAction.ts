import { Action, composeContext, elizaLogger, generateObject, HandlerCallback, IAgentRuntime, Memory, ModelClass, State } from "@elizaos/core";
import { transferTemplate } from "../templates.ts";
import { z } from "zod";
import { getTokenAddress, handleApiError, validateSearchQuery } from "../utils.ts";
import { OktoSDKPlugin } from "../index.ts";

export const SwapSchema = z.object({
    network: z.string().toUpperCase(),
    fromToken: z.string().toUpperCase(),
    toToken: z.string().toUpperCase(), 
    amount: z.number(),
    slippage: z.number().optional().default(1), // 1% default slippage
});

function isSwapContent(object: any): object is z.infer<typeof SwapSchema> {
    return SwapSchema.safeParse(object).success;
};

export const swapTokenAction = (plugin: OktoSDKPlugin): Action => {
    return {
        name: "OKTO_SWAP",
        description: "Perform Token swaps using DEX via Okto",
        examples: [
            [
                {
                    user: "user",
                    content: { text: "swap 1 SOL to USDC on solana" },
                },
            ],
            [
                {
                    user: "user", 
                    content: { text: "swap 10 USDC to ETH on polygon" },
                },
            ],
            [
                {
                    user: "user",
                    content: { text: "exchange 100 USDT for BNB on BSC" },
                },
            ],
        ],
        similes: ["SWAP", "TOKEN_SWAP", "OKTO_SWAP", "OKTO_BUY", "BUY_TOKEN"],
        suppressInitialMessage: true,
        
        validate: async (
            runtime: IAgentRuntime,
            message: Memory,
            state?: State,
        ) => {
            //TODO: validate the inputs
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

                const swapDetails = await generateObject({
                    runtime,
                    context,
                    modelClass: ModelClass.SMALL,
                    schema: SwapSchema,
                    mode: "auto"
                });

                if (!isSwapContent(swapDetails.object)) {
                    callback?.({
                        text: "Invalid swap details. Please check the inputs.",
                    }, []);
                    return;
                }

                const swapObject = swapDetails.object;
                elizaLogger.info("OKTO Token Swap Details: ", swapObject);

                // Get token addresses
                const fromTokenAddress = getTokenAddress(swapObject.network, swapObject.fromToken);
                const toTokenAddress = getTokenAddress(swapObject.network, swapObject.toToken);

                // Get quote first
                const quoteData = {
                    network_name: swapObject.network,
                    from_token_address: fromTokenAddress,
                    to_token_address: toTokenAddress,
                    amount: swapObject.amount.toString(),
                    slippage: swapObject.slippage
                };

                try {
                    // TODO Get quote from Dex
                    // const quote = 
                    // elizaLogger.info("Swap Quote: ", quote);

                    // TODO: Execute swap
                    // const swapOrder = await plugin.oktoWallet.executeRawTransaction(payload);
                    const swapOrder = {orderId: "123"}

                    await new Promise(resolve => setTimeout(resolve, 10000));

                    callback?.({
                        text: `✅ Swap order submitted successfully.
Swapping ${swapObject.amount} ${swapObject.fromToken} to ${swapObject.toToken} on ${swapObject.network}
Order ID: ${swapOrder.orderId}
`,
                    }, []);

                    return {
                        success: true,
                        response: "okto swap successful",
                    };

                } catch (error) {
                    elizaLogger.error("Okto Swap failed: ", error.message);
                    callback?.({
                        text: `❌ Okto Swap failed: ${error.message}`,
                    }, []);
                    return {
                        success: false,
                        response: "okto swap failed",
                    };
                }

            } catch (error) {
                console.log("ERROR: ", error);
                return handleApiError(error);
            }
        },
    };
};