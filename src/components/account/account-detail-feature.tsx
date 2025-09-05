// Fixed src/components/account/account-detail-feature.tsx
// Proper address resolution for Web3Auth

'use client'

import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWeb3AuthConnect } from '@web3auth/modal/react'
import { useSolanaWallet } from '@web3auth/modal/react/solana'
import { AccountTokens } from './account-ui'
import { ProfileStatsCard } from './profile-stats-card'
import { AccountWalletSection } from '@/components/solana/solana-provider'

export default function AccountDetailFeature() {
  const params = useParams()
  
  // Traditional wallet
  const { publicKey: traditionalPublicKey } = useWallet()
  
  // Web3Auth wallet
  const { isConnected: web3AuthConnected } = useWeb3AuthConnect()
  const { accounts } = useSolanaWallet()
  
  // Enhanced address resolution logic
  const address = useMemo(() => {
    // 1. First, try to use address from URL params
    if (params.address) {
      try {
        return new PublicKey(params.address)
      } catch (e) {
        console.log(`Invalid public key in params: ${params.address}`, e)
      }
    }
    
    // 2. If no params address, use connected wallet address
    // Priority: Web3Auth first (if connected), then traditional wallet
    if (web3AuthConnected && accounts?.[0]) {
      try {
        return new PublicKey(accounts[0])
      } catch (e) {
        console.log(`Invalid Web3Auth address: ${accounts[0]}`, e)
      }
    }
    
    // 3. Fallback to traditional wallet
    if (traditionalPublicKey) {
      return traditionalPublicKey
    }
    
    // 4. No valid address found
    return null
  }, [params.address, web3AuthConnected, accounts, traditionalPublicKey])

  // Debug logging to help troubleshoot
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Account Detail Debug:', {
      paramsAddress: params.address,
      web3AuthConnected,
      web3AuthAccount: accounts?.[0],
      traditionalPublicKey: traditionalPublicKey?.toString(),
      resolvedAddress: address?.toString(),
    })
  }

  const isAnyWalletConnected = web3AuthConnected || !!traditionalPublicKey

  // Show connection interface if no wallet is connected
  if (!isAnyWalletConnected) {
    return (
      <div className='lg:mt-[80px] mt-[40px] space-y-20'>
        {/* Profile Stats Card - Empty state */}
        <ProfileStatsCard />
        
        {/* Wallet Connection Section */}
        <div className="lg:px-[70px] px-4">
          <AccountWalletSection />
        </div>
      </div>
    )
  }

  // Show error if we can't resolve an address
  if (!address) {
    return (
      <div className='lg:mt-[80px] mt-[40px] space-y-20'>
        <ProfileStatsCard />
        
        <div className="lg:px-[70px] px-4">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-destructive mb-2">Address Resolution Error</h3>
            <p className="text-muted-foreground mb-4">
              Unable to resolve wallet address. Please check your wallet connection.
            </p>
            <AccountWalletSection />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='lg:mt-[80px] mt-[40px] space-y-20'>
      {/* Profile Stats Card */}
      <ProfileStatsCard />
      
      {/* Wallet Connection Status */}
      <div className="lg:px-[70px] px-4">
        <AccountWalletSection />
      </div>

      {/* Main Content - LP Positions with resolved address */}
      <AccountTokens address={address} />
    </div>
  )
}