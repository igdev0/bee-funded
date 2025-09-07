import { formatUnits } from 'ethers';

export function formatAmount(
  amount: string | bigint | number,
  decimals: number,
): string {
  try {
    // Always treat amount as a string (since it can be a BigInt)
    return formatUnits(amount.toString(), decimals);
  } catch {
    return amount.toString(); // fallback
  }
}
