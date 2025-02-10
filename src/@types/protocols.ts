export interface LendingParams {
    asset: string;
    amount: bigint;
    walletAddress: string;  // Added wallet address
}

export interface BorrowParams extends LendingParams {
    obligationOwnerCapId: string;
    obligationId: string;
} 