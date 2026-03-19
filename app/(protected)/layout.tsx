import ProtectedLayoutClient from './ProtectedLayoutClient'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
}
