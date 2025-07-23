import { PropsWithChildren } from "react"
import "./styles.css"
import Navbar from "@shared/components/navbar"

export default function Screen(props: PropsWithChildren) {
  return (
    <div className="screen">
      <Navbar />
      {props.children}
    </div>
  )
}
