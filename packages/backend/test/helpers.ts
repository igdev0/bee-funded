import { ethers } from 'ethers/lib.esm';
import { ERC20Permit } from '@bee-funded/contracts';
import { JsonRpcSigner } from 'ethers';

export async function generatePermitSignature(
  ownerSigner: JsonRpcSigner, // The ethers.Signer of the token owner
  spenderAddress: string, // The address of BeeFunded contract
  tokenContract: ERC20Permit, // The MockERC20 contract instance
  value: bigint, // The amount to permit (e.g., total subscription value)
  deadline: bigint, // The deadline for the permit signature
  chainId: number,
) {
  const ownerAddress = await ownerSigner.getAddress();
  const nonce = await tokenContract.nonces(ownerAddress); // Get current nonce for the owner
  const domain = {
    name: await tokenContract.name(), // Name of the ERC20Permit token (e.g., "MockToken")
    version: '1', // EIP-2612 standard version
    chainId: chainId,
    verifyingContract: await tokenContract.getAddress(), // Address of the ERC20Permit token contract
  };

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value: value,
    nonce: nonce,
    deadline: deadline,
  };

  // Use ownerSigner to sign the typed data
  const signature = await ownerSigner.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature); // Use ethers.Signature.from for splitting

  return {
    v: BigInt(sig.v),
    r: sig.r,
    s: sig.s,
    deadline,
  };
}
