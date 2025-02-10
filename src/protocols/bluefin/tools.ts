import Tools from '../../utils/tools';
import { BluefinProtocol } from './index';
import { handleError } from '../../utils';

class BluefinTools {
    public static registerTools(tools: Tools) {
        tools.registerTool(
            'get_exchange_info',
            'Get market data from Bluefin exchange',
            [
                {
                    name: 'network',
                    type: 'string',
                    description: 'Network to use (mainnet/testnet)',
                    required: true,
                },
                {
                    name: 'accountKey',
                    type: 'string',
                    description: 'Account private key',
                    required: true,
                }
            ],
            getExchangeInfoWrapper
        );

        tools.registerTool(
            'execute_trade',
            'Execute a trade on Bluefin exchange',
            [
                {
                    name: 'network',
                    type: 'string',
                    description: 'Network to use (mainnet/testnet)',
                    required: true,
                },
                {
                    name: 'accountKey',
                    type: 'string',
                    description: 'Account private key',
                    required: true,
                },
                {
                    name: 'symbol',
                    type: 'string',
                    description: 'Trading pair symbol (e.g., BTC-PERP)',
                    required: true,
                },
                {
                    name: 'quantity',
                    type: 'string',
                    description: 'Trade quantity',
                    required: true,
                },
                {
                    name: 'price',
                    type: 'string',
                    description: 'Trade price',
                    required: true,
                },
                {
                    name: 'side',
                    type: 'string',
                    description: 'Trade side (BUY/SELL)',
                    required: true,
                }
            ],
            executeTradeWrapper
        );

        tools.registerTool(
            'get_order_status',
            'Get status of an order on Bluefin exchange',
            [
                {
                    name: 'network',
                    type: 'string',
                    description: 'Network to use (mainnet/testnet)',
                    required: true,
                },
                {
                    name: 'accountKey',
                    type: 'string',
                    description: 'Account private key',
                    required: true,
                },
                {
                    name: 'orderId',
                    type: 'string',
                    description: 'Order ID to check',
                    required: true,
                }
            ],
            getOrderStatusWrapper
        );
    }
}

async function getExchangeInfoWrapper(
    ...args: (string | number | bigint | boolean)[]
): Promise<string> {
    try {
        const [network, accountKey] = args as [string, string];
        const config = {
            isTestnet: network === 'testnet',
            accountKey
        };

        const protocol = BluefinProtocol.getInstance(config);
        await protocol.initialize();
        const info = await protocol.getExchangeInfo();

        return JSON.stringify([{
            reasoning: 'Successfully retrieved exchange information',
            response: JSON.stringify(info.data, null, 2),
            status: 'success',
            query: 'Get exchange information',
            errors: []
        }]);
    } catch (error) {
        return JSON.stringify([
            handleError(error, {
                reasoning: 'Failed to get exchange information',
                query: 'Get exchange information'
            })
        ]);
    }
}

async function executeTradeWrapper(
    ...args: (string | number | bigint | boolean)[]
): Promise<string> {
    try {
        const [network, accountKey, symbol, quantity, price, side] = args as [string, string, string, string, string, string];
        const config = {
            isTestnet: network === 'testnet',
            accountKey
        };

        const protocol = BluefinProtocol.getInstance(config);
        await protocol.initialize();
        const result = await protocol.executeTrade({
            symbol,
            quantity: parseFloat(quantity),
            price: parseFloat(price),
            side: side as 'BUY' | 'SELL'
        });

        return JSON.stringify([{
            reasoning: 'Successfully executed trade',
            response: JSON.stringify(result.data, null, 2),
            status: 'success',
            query: `Execute ${side} trade for ${quantity} ${symbol} at ${price}`,
            errors: []
        }]);
    } catch (error) {
        return JSON.stringify([
            handleError(error, {
                reasoning: 'Failed to execute trade',
                query: 'Execute trade'
            })
        ]);
    }
}

async function getOrderStatusWrapper(
    ...args: (string | number | bigint | boolean)[]
): Promise<string> {
    try {
        const [network, accountKey, orderId] = args as [string, string, string];
        const config = {
            isTestnet: network === 'testnet',
            accountKey
        };

        const protocol = BluefinProtocol.getInstance(config);
        await protocol.initialize();
        const status = await protocol.getOrderStatus(orderId);

        return JSON.stringify([{
            reasoning: 'Successfully retrieved order status',
            response: JSON.stringify(status.data, null, 2),
            status: 'success',
            query: `Get status for order ${orderId}`,
            errors: []
        }]);
    } catch (error) {
        return JSON.stringify([
            handleError(error, {
                reasoning: 'Failed to get order status',
                query: 'Get order status'
            })
        ]);
    }
}

export default BluefinTools; 