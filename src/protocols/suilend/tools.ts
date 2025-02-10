import Tools from '../../utils/tools';
import { getLendingRatesWrapper, lendTokensWrapper, borrowTokensWrapper } from '../../utils/toolWrappers';

class SuilendTools {
    public static registerTools(tools: Tools) {
        tools.registerTool(
            'get_lending_rates',
            'Tool to get current lending rates from Suilend',
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
            getLendingRatesWrapper
        );

        tools.registerTool(
            'lend_tokens',
            'Tool to lend tokens on Suilend',
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
                    name: 'walletAddress',
                    type: 'string',
                    description: 'Wallet address to lend from',
                    required: true,
                },
                {
                    name: 'asset',
                    type: 'string',
                    description: 'Asset to lend',
                    required: true,
                },
                {
                    name: 'amount',
                    type: 'string',
                    description: 'Amount to lend',
                    required: true,
                }
            ],
            lendTokensWrapper
        );

        tools.registerTool(
            'borrow_tokens',
            'Tool to borrow tokens from Suilend',
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
                    name: 'walletAddress',
                    type: 'string',
                    description: 'Wallet address to receive borrowed tokens',
                    required: true,
                },
                {
                    name: 'obligationOwnerCapId',
                    type: 'string',
                    description: 'ID of the obligation owner capability',
                    required: true,
                },
                {
                    name: 'obligationId',
                    type: 'string',
                    description: 'ID of the obligation',
                    required: true,
                },
                {
                    name: 'asset',
                    type: 'string',
                    description: 'Asset to borrow',
                    required: true,
                },
                {
                    name: 'amount',
                    type: 'string',
                    description: 'Amount to borrow',
                    required: true,
                }
            ],
            borrowTokensWrapper
        );
    }
}

export default SuilendTools; 