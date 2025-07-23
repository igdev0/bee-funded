import { ComponentPropsWithRef } from "react"

export interface Props extends ComponentPropsWithRef<"div"> {
  size?: "sm" | "md" | "lg"
}

export default function Spinner(props: Props = { size: "md" }) {
  let size: number
  switch (props.size) {
    case "sm":
      size = 4
      break
    case "md":
      size = 6
      break
    case "lg":
      size = 10
      break
    default:
      size = 6
  }

  return (
    <div
      ref={props.ref}
      className={`w-${size} aspect-square rounded-full border-2 border-transparent border-t-primary border-l-primary animate-spin`}
    />
  )
}
