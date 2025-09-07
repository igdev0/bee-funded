import { formatUnits } from 'ethers';
import * as process from 'node:process';

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

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
}

const appUrl = process.env.APP_FRONTEND_URL ?? 'http://localhost:5173';
const config = {
  appName: process.env.APP_NAME ?? 'BeeFunded',
  appUrl,
  dashboardUrl: `${appUrl}/dashboard`,
};

export function globalVar(key: keyof typeof config) {
  return config[key];
}
