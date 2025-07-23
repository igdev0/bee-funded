import ConnectWalletButton from "@shared/components/connect-wallet-button"
import { ThemeToggle } from "@shared/components/theme-toggle"
import NotificationList from "@features/notification/components/notification-list.tsx"

export default function Navbar() {
  return (
    <nav className="flex justify-end w-full gap-4 p-4">
      <NotificationList />
      <ConnectWalletButton />
      <ThemeToggle />
    </nav>
  )
}
