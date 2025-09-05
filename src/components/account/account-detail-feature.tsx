// Updated src/components/account/account-detail-feature.tsx
'use client'

import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { AccountTokens } from './account-ui'
import { ProfileStatsCard } from './profile-stats-card'
import { AccountWalletSection } from '@/components/solana/solana-provider'
import { useEnhancedWallet } from '@/hooks/useEnhancedWallet'

export default function AccountDetailFeature() {
  const params = useParams()
  const enhancedWallet = useEnhancedWallet()
  
  const address = useMemo(() => {
    if (!params.address) {
      return enhancedWallet.publicKey // Use connected wallet if no address in params
    }
    try {
      return new PublicKey(params.address)
    } catch (e) {
      console.log(`Invalid public key`, e)
      return enhancedWallet.publicKey // Fallback to connected wallet
    }
  }, [params, enhancedWallet.publicKey])

  if (!address && !enhancedWallet.isConnected) {
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

  if (!address) {
    return <div>Error loading account</div>
  }

  return (
    <div className='lg:mt-[80px] mt-[40px] space-y-20'>
      {/* Profile Stats Card */}
      <ProfileStatsCard />
      
      {/* Wallet Connection Status */}
      {enhancedWallet.isConnected && (
        <div className="lg:px-[70px] px-4">
          <AccountWalletSection />
        </div>
      )}

      {/* Main Content - LP Positions */}
      <AccountTokens address={address} />
    </div>
  )
}