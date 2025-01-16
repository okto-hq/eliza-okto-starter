export const transferTemplate = `
Extract the following details for processing token transfer using the Okto SDK:
- **receivingAddress** (string): The address to transfer the tokens to.
- **transferAmount** (number): The amount to transfer to the address. This can be a decimal number as well.
- **assetId** (string): The asset ID to transfer (e.g., ETH, BTC).
- **network** (string): The blockchain network to use. Allowed values are:
    static networks: {
        readonly BaseTestnet: "BASE_TESTNET";
        readonly Base: "BASE";
        readonly Ethereum: "ETHEREUM";
        readonly Polygon: "POLYGON";
        readonly PolygonAmoyTestnet: "POLYGON_TESTNET_AMOY";
        readonly SolanaDevnet: "SOLANA_DEVNET";
        readonly Solana: "SOLANA";
        readonly Aptos: "APTOS";
    };

Only Provide the details in the following JSON format:

{
    "receivingAddress": "<receiving_address>",
    "transferAmount": "<amount>",
    "assetId": "<asset_id>",
    "network": "<network>"
}

Here are the recent user messages for context:
{{recentMessages}}
`;