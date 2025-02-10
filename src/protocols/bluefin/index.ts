import { BluefinClient, Networks, ORDER_SIDE, ORDER_TYPE, ORDER_STATUS } from '@bluefin-exchange/bluefin-v2-client';
import { ProtocolConfig, TradeParams, MarketData, ProtocolResponse } from '../../@types/interface';

// Define the ExchangeInfo interface based on the actual API response
interface ExchangeInfo {
    symbol: string;
    lastPrice: string;
    volume24h: string;
    marketPrice: string;
    _24hrHighPrice: string;
    _24hrLowPrice: string;
    _24hrVolume: string;
    _24hrPriceChangePercent: string;
}

interface BluefinResponse<T> {
    data: T;
    ok: boolean;
    status: number;
    response: {
        data: T;
        message: string;
        errorCode: number;
    };
}

interface OrderResponse {
    orderId: string;
    status: string;
    symbol: string;
    side: string;
    price: string;
    quantity: string;
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
        } catch (error) {
            throw new Error(`Failed to initialize Bluefin client: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async getExchangeInfo(): Promise<ProtocolResponse<MarketData[]>> {
        try {
            const response = await this.client.getExchangeInfo() as unknown as BluefinResponse<ExchangeInfo[]>;
            return {
                success: true,
                data: response.data.map((item) => ({
                    symbol: item.symbol,
                    price: parseFloat(item.lastPrice),
                    volume: parseFloat(item.volume24h),
                    timestamp: Date.now()
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to fetch exchange info: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    public async executeTrade(params: TradeParams): Promise<ProtocolResponse<string>> {
        try {
            const order = await this.client.postOrder({
                symbol: params.symbol,
                price: Number(params.price),
                quantity: Number(params.quantity),
                side: params.side as ORDER_SIDE,
                orderType: 'LIMIT' as ORDER_TYPE,
                leverage: 1
            });

            return {
                success: true,
                data: order.data.id.toString()
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to execute trade: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    public async getOrderStatus(orderId: string): Promise<ProtocolResponse<OrderResponse>> {
        try {
            const response = await this.client.getUserOrders({
                orderId : Number(orderId),
                statuses: [
                    ORDER_STATUS.OPEN,
                    ORDER_STATUS.PARTIAL_FILLED,
                    ORDER_STATUS.FILLED,
                    ORDER_STATUS.CANCELLED,
                    ORDER_STATUS.REJECTED
                ]
            });

            if (!response.data || response.data.length === 0) {
                return {
                    success: false,
                    error: `Order not found: ${orderId}`
                };
            }

            const order = response.data[0];
            return {
                success: true,
                data: {
                    orderId: order.id.toString(),
                    status: order.orderStatus,
                    symbol: order.symbol,
                    side: order.side,
                    price: order.price.toString(),
                    quantity: order.quantity.toString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to get order status: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}
