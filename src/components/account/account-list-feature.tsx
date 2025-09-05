// Updated src/components/account/account-list-feature.tsx
'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWeb3AuthConnect } from '@web3auth/modal/react'
import { useSolanaWallet } from '@web3auth/modal/react/solana'
import { AccountWalletSection } from '@/components/solana/solana-provider'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function AccountListFeature() {
  const { publicKey: traditionalPublicKey } = useWallet()
  const { isConnected: web3AuthConnected } = useWeb3AuthConnect()
  const { accounts } = useSolanaWallet()

  // Check if any wallet is connected and redirect to account page
  useEffect(() => {
    if (traditionalPublicKey) {
      redirect(`/account/${traditionalPublicKey.toString()}`)
    } else if (web3AuthConnected && accounts?.[0]) {
      redirect(`/account/${accounts[0]}`)
    }
  }, [traditionalPublicKey, web3AuthConnected, accounts])

  // Show wallet connection interface
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to Your Account</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Connect your wallet to view your account details, LP positions, and transaction history.
          </p>
        </div>
        
        <AccountWalletSection />
        
        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 text-left">
            <div className="bg-gradient-card/50 rounded-xl p-6 border border-border/20">
              <h3 className="font-semibold text-white mb-2">🔐 Traditional Wallets</h3>
              <p className="text-sm text-muted-foreground">
                Connect with Phantom, Solflare, or any Solana wallet adapter compatible wallet.
              </p>
            </div>
            <div className="bg-gradient-card/50 rounded-xl p-6 border border-border/20">
              <h3 className="font-semibold text-white mb-2">🔗 Social Login</h3>
              <p className="text-sm text-muted-foreground">
                Sign in with Google, Twitter, Discord, or email for instant wallet creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}