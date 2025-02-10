import { SuilendClient, LENDING_MARKET_ID, LENDING_MARKET_TYPE } from '@suilend/sdk';
import {
    ProtocolConfig,
    LendingParams,
    BorrowParams,
    LendingRate,
    ProtocolResponse,
    ParsedReserve
} from '../../@types/interface';
import { SuiClient } from "@mysten/sui/client";
import { NETWORK_CONFIG } from '../../@types/interface';
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Keypair } from '@mysten/sui/cryptography';
import { initializeSuilend } from '@suilend/sdk/lib/initialize';

interface RateType {
    coinType: string;
    symbol: string;
    supplyApy: number;
    borrowApy: number;
    utilizationRate: number;
    borrowInterestRate: number;
    supplyInterestRate: number;
}

export class SuilendProtocol {
    private client!: SuilendClient;
    private suiClient: SuiClient;
    private signer: Keypair;
    private static instance: SuilendProtocol;

    private constructor(config: ProtocolConfig) {
        // Initialize SUI client based on network
        this.suiClient = new SuiClient({
            url: config.isTestnet ? NETWORK_CONFIG.TESTNET.fullnode : NETWORK_CONFIG.MAINNET.fullnode
        });

        // Initialize signer from private key
        this.signer = Ed25519Keypair.fromSecretKey(Buffer.from(config.accountKey, 'hex'));
    }

    public static getInstance(config: ProtocolConfig): SuilendProtocol {
        if (!SuilendProtocol.instance) {
            SuilendProtocol.instance = new SuilendProtocol(config);
        }
        return SuilendProtocol.instance;
    }

    public async initialize(): Promise<void> {
        try {
            // Initialize Suilend client properly
            this.client = await SuilendClient.initialize(
                LENDING_MARKET_ID,
                LENDING_MARKET_TYPE,
                this.suiClient
            );
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to initialize Suilend client: ${errorMessage}`);
        }
    }

    public async getLendingRates(): Promise<ProtocolResponse<LendingRate[]>> {
        try {
            if (!this.client) {
                throw new Error('Suilend client not initialized');
            }

            // Get market data including reserves using the SDK's initialize function
            const marketData = await initializeSuilend(this.suiClient, this.client);
            const { reserveMap } = marketData;

            // Transform the reserves data into our LendingRate format
            const rates : RateType[] = Object.entries(reserveMap as unknown as ParsedReserve[]).map(([coinType, reserve]) => {
                return {
                    coinType,
                    symbol: reserve.symbol,
                    // Lending (supply) APY
                    supplyApy: reserve.supplyApy.toNumber(),
                    // Borrowing APY
                    borrowApy: reserve.borrowApy.toNumber(),
                    // Additional rate information
                    utilizationRate: reserve.utilizationRate.toNumber(),
                    borrowInterestRate: reserve.borrowInterestRate.toNumber(),
                    supplyInterestRate: reserve.supplyInterestRate.toNumber()
                };
            });

            return {
                success: true,
                data: rates.map(rate => ({
                    asset: rate.symbol || rate.coinType,
                    supplyRate: rate.supplyApy,
                    borrowRate: rate.borrowApy,
                    utilization: rate.utilizationRate
                }))
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: `Failed to fetch lending rates: ${errorMessage}`
            };
        }
    }

    public async lendTokens(params: LendingParams): Promise<ProtocolResponse<string>> {
        try {
            if (!this.client) {
                throw new Error('Suilend client not initialized');
            }

            // Create new transaction
            const tx = new Transaction();

            // Get user's coins
            const coins = await this.suiClient.getCoins({
                owner: params.walletAddress,
                coinType: params.asset
            });

            if (!coins.data.length) {
                throw new Error(`No coins found for type ${params.asset}`);
            }

            // Let the SDK handle the coin merging and splitting
            await this.client.depositLiquidityAndGetCTokens(
                params.walletAddress,  // ownerId
                params.asset,          // coinType
                params.amount.toString(), // value
                tx                     // transaction
            );

            // Execute transaction
            const result = await this.suiClient.signAndExecuteTransaction({
                transaction: tx,
                signer: this.signer,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });

            return {
                success: true,
                data: result.digest
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: `Failed to lend tokens: ${errorMessage}`
            };
        }
    }

    public async borrowTokens(params: BorrowParams): Promise<ProtocolResponse<string>> {
        try {
            if (!this.client) {
                throw new Error('Suilend client not initialized');
            }

            // Create new transaction
            const tx = new Transaction();

            // Borrow tokens and send to user
            await this.client.borrowAndSendToUser(
                params.walletAddress,
                params.obligationOwnerCapId,
                params.obligationId,
                params.asset,
                params.amount.toString(),
                tx
            );

            // Execute transaction
            const result = await this.suiClient.signAndExecuteTransaction({
                transaction: tx,
                signer: this.signer,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });

            return {
                success: true,
                data: result.digest
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: `Failed to borrow tokens: ${errorMessage}`
            };
        }
    }
}
