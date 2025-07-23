export interface Props {
  title?: string
  description?: string
}

const defaultProps = {
  title: "🤖Looks like your wallet is not connected",
  description: "Please connect your wallet so you can use this feature.",
}
export default function NotConnected(props?: Props) {
  return (
    <div className="text-center">
      <h1 className="text-primary text-3xl font-bold">
        {props?.title ?? defaultProps.title}
      </h1>
      <p className="text-primary">
        {props?.description ?? defaultProps.description}
      </p>
    </div>
  )
}
