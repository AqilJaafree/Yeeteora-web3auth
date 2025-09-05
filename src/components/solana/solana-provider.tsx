'use client'

import { WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { useWeb3AuthConnect } from '@web3auth/modal/react'
import { useSolanaWallet } from '@web3auth/modal/react/solana'
import dynamic from 'next/dynamic'
import { ReactNode, useCallback, useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { Button } from '../ui/button'
import '@solana/wallet-adapter-react-ui/styles.css'

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

// Web3Auth Wallet Button Component
function Web3AuthWalletButton() {
  const { connect, loading, isConnected } = useWeb3AuthConnect()
  const { accounts } = useSolanaWallet()

  if (isConnected && accounts?.length) {
    return (
      <Button variant="outline" disabled>
        {accounts[0].slice(0, 4)}...{accounts[0].slice(-4)}
      </Button>
    )
  }

  return (
    <Button 
      onClick={connect} 
      disabled={loading}
      variant="secondary"
      className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500 text-blue-400 hover:from-blue-600/30 hover:to-purple-600/30"
    >
      {loading ? 'Connecting...' : 'Social Login'}
    </Button>
  )
}

// Combined Wallet Button
export function WalletButton() {
  return (
    <div className="flex items-center gap-2">
      <Web3AuthWalletButton />
      <WalletMultiButton
        style={{
          backgroundColor: "var(--primary)",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontFamily: "var(--font-sans)",
          height: "100%",
          lineHeight: "100%",
        }}
      />
    </div>
  )
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}