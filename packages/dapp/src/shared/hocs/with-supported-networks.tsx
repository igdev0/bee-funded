import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog"
import { useAccount, useChains, useSwitchChain } from "wagmi"
import { ComponentType, MemoExoticComponent } from "react"
import { Button } from "@shared/ui/button.tsx"

export default function withConnectedNetworks<
  T extends Record<string, unknown>,
>(Element: ComponentType<T> | MemoExoticComponent<ComponentType<T>>) {
  return function WithConnectedNetworks(props: T) {
    const account = useAccount()
    const chains = useChains()
    const switchChain = useSwitchChain()

    const onChainClick = (id: number) => {
      return () => {
        switchChain.switchChain({ chainId: id })
      }
    }

    return (
      <>
        <AlertDialog
          open={
            !account.chainId
              ? false
              : !chains.some(item => account.chainId === item.id)
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                🤖 The network you're connected to, is not supported
              </AlertDialogTitle>
              <AlertDialogDescription>
                Please switch the network to one of the supported networks by
                clicking on one of the following networks, or change it manually
                from the provider.
              </AlertDialogDescription>
              <AlertDialogDescription>
                {chains.map(chain => (
                  <Button
                    className="flex w-full text-left cursor-pointer"
                    key={chain.id}
                    onClick={onChainClick(chain.id)}
                  >
                    {chain.name}
                  </Button>
                ))}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
        <Element {...props} />
      </>
    )
  }
}
