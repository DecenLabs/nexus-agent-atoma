import { BluefinClient, Networks } from '@bluefin-exchange/bluefin-v2-client';
import { ProtocolConfig, TradeParams, MarketData, ProtocolResponse } from '../../@types/interface';

// Updated interface definitions to match actual API response
interface ExchangeInfoItem {
    symbol: string;
    lastPrice: string;
    volume24h: string;
}

interface ExchangeInfo {
    data: ExchangeInfoItem[];
    ok: boolean;
    status: number;
    response: {
        data: any;
        message: any;
        errorCode: any;
    };
}

interface OrderResponse {
    orderId: string;
}

interface OrderStatus {
    // Add specific order status fields based on API response
    status: string;
    filledQuantity: string;
    remainingQuantity: string;
    // ... other fields
}

export class BluefinProtocol {
    private client: BluefinClient;
    private static instance: BluefinProtocol;

    private constructor(config: ProtocolConfig) {
        this.client = new BluefinClient(
            config.isTestnet,
            config.isTestnet ? Networks.TESTNET_SUI : Networks.PRODUCTION_SUI,
            config.accountKey,
            'ED25519'
        );
    }

    public static getInstance(config: ProtocolConfig): BluefinProtocol {
        if (!BluefinProtocol.instance) {
            BluefinProtocol.instance = new BluefinProtocol(config);
        }
        return BluefinProtocol.instance;
    }

    public async initialize(): Promise<void> {
        try {
            await this.client.init();
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to initialize Bluefin client: ${error.message}`);
            }
            throw new Error('Failed to initialize Bluefin client: Unknown error');
        }
    }

    public async getExchangeInfo(): Promise<ProtocolResponse<MarketData[]>> {
        try {
            const response = await this.client.getExchangeInfo();
            const exchangeInfo = response as unknown as ExchangeInfo;
            
            return {
                success: true,
                data: exchangeInfo.data.map((item: ExchangeInfoItem) => ({
                    symbol: item.symbol,
                    price: parseFloat(item.lastPrice),
                    volume: parseFloat(item.volume24h),
                    timestamp: Date.now()
                }))
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to fetch exchange info: ${errorMessage}`
            };
        }
    }

    public async executeTrade(params: TradeParams): Promise<ProtocolResponse<string>> {
        try {
            // Type assertion for client.createOrder
            const order = await (this.client as any).createOrder({
                symbol: params.symbol,
                price: params.price.toString(),
                quantity: params.quantity.toString(),
                side: params.side,
                orderType: 'LIMIT'
            }) as OrderResponse;

            return {
                success: true,
                data: order.orderId
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to execute trade: ${errorMessage}`
            };
        }
    }

    public async getOrderStatus(orderId: string): Promise<ProtocolResponse<OrderStatus>> {
        try {
            // Type assertion for client.getOrder
            const status = await (this.client as any).getOrder(orderId) as OrderStatus;
            return {
                success: true,
                data: status
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to get order status: ${errorMessage}`
            };
        }
    }
}
