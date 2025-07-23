import { useAccount, useChainId } from "wagmi"
import {
  useReadCounterCount,
  useWriteCounterDecrement,
  useWriteCounterIncrement,
} from "@shared/hooks/generated.ts"
import { Button } from "@shared/ui/button.tsx"

function Counter() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const count = useReadCounterCount()
  const increment = useWriteCounterIncrement()
  const decrement = useWriteCounterDecrement()

  const handleIncrement = async () => {
    await increment.writeContractAsync({
      chainId: chainId as keyof object,
    })
    await count.refetch()
  }
  const handleDecrement = async () => {
    await decrement.writeContractAsync({ chainId: chainId as keyof object })
    await count.refetch()
  }
  return (
    <div className="flex flex-col w-full items-center justify-center gap-5 mt-40">
      <h1 className="text-4xl font-bold text-primary">
        Count{": "}
        <span className="text-secondary-foreground">
          {count.data}
          {count.isPending && "Fetching ..."}
        </span>
      </h1>
      <div className="flex gap-2">
        <Button
          onClick={handleIncrement}
          disabled={increment.isPending || !isConnected}
        >
          Increment
        </Button>
        <Button
          onClick={handleDecrement}
          disabled={decrement.isPending || !isConnected}
        >
          Decrement
        </Button>
      </div>
    </div>
  )
}

export default Counter
