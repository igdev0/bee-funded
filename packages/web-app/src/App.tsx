import {Connector, useAccount, useConnect, useDisconnect} from 'wagmi';

function App() {
  const account = useAccount()
  const { connectors, connectAsync, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = (connector: Connector) => {
    return async () => {
      const c = await connectAsync({connector});
      console.log(c);
    }
  }

  return (
    <>
      <div>
        <h2>Account</h2>

        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>

        {account.status === 'connected' && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={handleConnect(connector)}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>
    </>
  )
}

export default App
