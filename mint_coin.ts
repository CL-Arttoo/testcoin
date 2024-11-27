import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
// Define interfaces for better type safety
interface TokenConfig {
    mintTarget: string;
    treasuryCap: string;
}

const enum Type {
    mock_artwork = 'mock_artwork',
    mock_usdc = 'mock_usdc',
}

// Configuration map for different token types
const TOKEN_CONFIGS: Record<Type, TokenConfig> = {
    [Type.mock_artwork]: {
        mintTarget: '0xea38231341ce244153e54a2aa058a846b077d96b46f6a86d9fc8b85c38668eea::mock_artwork_token::mint',
        treasuryCap: '0x884b5cc0280beb19923a2e8c31e7a0bb1df28bf7cbc374a4294dd7b191f0f5be'
    },
    [Type.mock_usdc]: {
        mintTarget: '0xea38231341ce244153e54a2aa058a846b077d96b46f6a86d9fc8b85c38668eea::mock_usdc::mint',
        treasuryCap: '0x631991762fa50dfebe90f1b8c973dcb9f5cd0661d207cba0661ee98bd2af8c35'
    },
};

// Function to mint coins with dynamic token type
async function mintCoin(
    privateKey: string,
    tokenType: Type,
    amount: bigint,
    recipient: string,
) {
    try {
        const rpcUrl = getFullnodeUrl('testnet');
        const client = new SuiClient({ url: rpcUrl });

        // Initialize signer from private key
        const keypair = Secp256k1Keypair.fromSecretKey(privateKey);

        // Get token configuration
        const tokenConfig = TOKEN_CONFIGS[tokenType];
        if (!tokenConfig) {
            throw new Error(`Unsupported token type: ${tokenType}`);
        }

        // Create a new transaction block
        const tx = new Transaction();
        tx.setGasBudget(10000000);
        tx.moveCall({
            target: tokenConfig.mintTarget,
            arguments: [
                tx.object(tokenConfig.treasuryCap),
                tx.pure.u64(amount),
                tx.pure.address(recipient)
            ],
        });

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            requestType: 'WaitForLocalExecution',
            options: {
                showEffects: true,
            },
        });

        return {
            success: true,
            txId: result.digest,
            effects: result.effects,
            tokenType
        };
    } catch (error) {
        console.error(`Error minting ${tokenType} coins:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            tokenType
        };
    }
}

// Main execution function
async function main() {
    // Replace these with your test wallet details
    const TEST_PRIVATE_KEY = "..";
    const RECIPIENT_ADDRESS = "..";
    const MINT_AMOUNT = BigInt(10_000_000);

    try {
        console.log('Starting to mint coins...');

        // Mint different types of tokens
        const tokens = [Type.mock_artwork, Type.mock_usdc];

        for (const tokenType of tokens) {
            console.log(`Minting ${tokenType}...`);
            const mintResult = await mintCoin(
                TEST_PRIVATE_KEY,
                tokenType,
                MINT_AMOUNT,
                RECIPIENT_ADDRESS
            );

            if (mintResult.success) {
                console.log(`Successfully minted ${tokenType}!`);
                console.log('Transaction ID:', mintResult.txId);
                console.log('Transaction effects:', mintResult.effects);
            } else {
                console.error(`Failed to mint ${tokenType}:`, mintResult.error);
            }
        }
    } catch (error) {
        console.error('Error in main execution:', error);
    }
}

// Execute the main function
main().catch(console.error);