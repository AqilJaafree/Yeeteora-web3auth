// src/components/account/lp-positions-data-access.tsx
'use client'

import { useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import DLMM from '@meteora-ag/dlmm'
import BN from 'bn.js'
import { toast } from 'sonner'
import { useEnhancedWallet } from '@/hooks/useEnhancedWallet'

// Import the actual types from DLMM library
import type { PositionInfo } from '@meteora-ag/dlmm'

// Export the position type to match the DLMM library structure
export type PositionType = {
  publicKey: PublicKey
  positionData: {
    lowerBinId: number
    upperBinId: number
    lastUpdatedAt: BN
    totalXAmount: string
    totalYAmount: string
    feeX: BN
    feeY: BN
    totalClaimedFeeXAmount: BN
    totalClaimedFeeYAmount: BN
    positionBinData: Array<{
      binId: number
      price: string
      pricePerToken: string
      binXAmount: string
      binYAmount: string
      binLiquidity: string
      positionLiquidity: string
      positionXAmount: string
      positionYAmount: string
      positionFeeXAmount: string
      positionFeeYAmount: string
    }>
  }
  tokenXDecimals?: number
  tokenYDecimals?: number
}

// Use the actual PositionInfo type from DLMM library
export type LBPairPositionInfo = PositionInfo

// Type helper to handle transaction compatibility issues
type TransactionLike = Transaction | VersionedTransaction

// Helper function to handle different transaction types safely
function ensureTransactionFields(
  tx: TransactionLike, 
  blockInfo: { blockhash: string; lastValidBlockHeight: number },
  feePayer: PublicKey
): void {
  try {
    // Type guard to check if it's a legacy Transaction
    if ('recentBlockhash' in tx && 'lastValidBlockHeight' in tx && 'feePayer' in tx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tx as any).recentBlockhash = blockInfo.blockhash
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(tx as any).lastValidBlockHeight = blockInfo.lastValidBlockHeight
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(tx as any).feePayer = feePayer
    }
    // For VersionedTransaction, properties are handled differently
    else if ('message' in tx) {
      // VersionedTransaction handling - these fields are set during construction
      // We'll rely on the DLMM library to handle this properly
    }
  } catch (error) {
    console.warn('Transaction field setting warning:', error)
    // Continue execution as the enhanced wallet should handle this
  }
}

// Hook to get all LP positions for a wallet using the working sample pattern
export function useGetLPPositions({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-lp-positions', { endpoint: connection.rpcEndpoint, address: address.toString() }],
    queryFn: async (): Promise<Map<string, PositionInfo>> => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Starting LP position discovery...')
        }
        
        // Use custom RPC for heavy operations if available
        const customRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          process.env.NEXT_PUBLIC_Custom_RPC_URL ||
          process.env.NEXT_PUBLIC_HEAVY_RPC_URL ||
          connection.rpcEndpoint
        
        // Create optimized connection for heavy operations
        const discoveryConnection = customRpcUrl !== connection.rpcEndpoint
          ? new Connection(
              customRpcUrl,
              {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
              }
            )
          : connection
        
        // Test connection first
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('🧪 Testing RPC connection...')
          }
          await discoveryConnection.getVersion()
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ RPC connection successful')
          }
        } catch (rpcError: unknown) {
          console.error('❌ RPC connection test failed:', rpcError instanceof Error ? rpcError.message : 'Unknown RPC error')
          throw new Error(`RPC connection failed: ${rpcError instanceof Error ? rpcError.message : 'Unknown RPC error'}`)
        }
        
        // Get all positions using the working DLMM method
        const userPositions = await DLMM.getAllLbPairPositionsByUser(
          discoveryConnection,
          address
        )
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎉 DISCOVERY COMPLETE! Found ${userPositions.size} position(s)`)
        }
        
        return userPositions
        
      } catch (error: unknown) {
        // Only log detailed error info in development
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ LP position discovery failed:', error)
        }
        
        // Enhanced error handling and guidance
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
          if (process.env.NODE_ENV === 'development') {
            console.error('💡 RPC Error Solution:')
            console.error('   - Your RPC is blocking heavy operations (getProgramAccounts)')
            console.error('   - Set NEXT_PUBLIC_SOLANA_RPC_URL in your .env.local file')
            console.error('   - Use a paid RPC provider like Alchemy, QuickNode, or Helius')
          }
        } else if (errorMessage.includes('timeout')) {
          if (process.env.NODE_ENV === 'development') {
            console.error('💡 Timeout Error Solution:')
            console.error('   - Position discovery took longer than expected')
            console.error('   - Try again in a few minutes')
            console.error('   - Consider using a faster RPC provider')
          }
        } else if (errorMessage.includes('connection')) {
          if (process.env.NODE_ENV === 'development') {
            console.error('💡 Connection Error Solution:')
            console.error('   - Check your internet connection')
            console.error('   - Verify your RPC URL is correct')
            console.error('   - Try switching to a different RPC endpoint')
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.error(`💡 Unexpected Error: ${errorMessage}`)
          console.error('   - This might be a temporary issue')
          console.error('   - Try refreshing the page')
        }
        
        // Return empty Map instead of throwing to prevent UI crashes
        return new Map()
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - positions don't change frequently
    retry: (failureCount, error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Don't retry certain errors that won't resolve with retries
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Not retrying 403 errors - RPC configuration issue')
        }
        return false
      }
      if (errorMessage.includes('connection')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Not retrying connection errors - check RPC URL')
        }
        return false
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Retrying position discovery... (attempt ${failureCount + 1}/3)`)
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000)
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏳ Waiting ${delay}ms before retry...`)
      }
      return delay
    },
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid excessive API calls
  })
}

// Enhanced hook for position actions using the unified wallet system
export function usePositionActions(
  lbPairAddress: string,
  pos: PositionType,
  refreshPositions: () => void
) {
  const [closing, setClosing] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const { connection } = useConnection()
  
  // Use the enhanced wallet hook that supports both traditional and Web3Auth wallets
  const enhancedWallet = useEnhancedWallet()

  const handleCloseAndWithdraw = async () => {
    if (!enhancedWallet.isConnected || !enhancedWallet.publicKey) {
      toast.error('Please connect your wallet', {
        description: 'Connect either a traditional Solana wallet or use social login'
      })
      return
    }

    setClosing(true)
    
    try {
      const posKey = pos.publicKey
      const user = enhancedWallet.publicKey
      const lowerBinId = Number(pos.positionData.lowerBinId)
      const upperBinId = Number(pos.positionData.upperBinId)
      
      const customRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || connection.rpcEndpoint
      const closeConnection = customRpcUrl !== connection.rpcEndpoint
        ? new Connection(customRpcUrl, { commitment: 'confirmed' })
        : connection

      // Create DLMM pool instance
      const dlmmPool = await DLMM.create(
        closeConnection,
        new PublicKey(lbPairAddress)
      )
      
      // Create the remove liquidity transaction
      const txOrTxs = await dlmmPool.removeLiquidity({
        user,
        position: posKey,
        fromBinId: lowerBinId,
        toBinId: upperBinId,
        bps: new BN(10000), // 100% removal
        shouldClaimAndClose: true,
      })
      
      // Handle both single transaction and transaction array
      if (Array.isArray(txOrTxs)) {
        // Multiple transactions
        for (const tx of txOrTxs) {
          // Get block info for transaction
          const block = await closeConnection.getLatestBlockhash('confirmed')
          
          // Set transaction fields safely using our helper
          ensureTransactionFields(tx as TransactionLike, block, user)

          // Use the enhanced wallet's unified transaction signing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const signature = await enhancedWallet.signAndSendTransaction(tx as any, closeConnection)
          
          // Confirm each transaction
          await closeConnection.confirmTransaction({
            signature,
            blockhash: block.blockhash,
            lastValidBlockHeight: block.lastValidBlockHeight
          }, 'confirmed')
        }
      } else {
        // Single transaction
        const block = await closeConnection.getLatestBlockhash('confirmed')
        
        // Set transaction fields safely using our helper
        ensureTransactionFields(txOrTxs as TransactionLike, block, user)

        // Use the enhanced wallet's unified transaction signing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signature = await enhancedWallet.signAndSendTransaction(txOrTxs as any, closeConnection)
        
        // Confirm transaction
        await closeConnection.confirmTransaction({
          signature,
          blockhash: block.blockhash,
          lastValidBlockHeight: block.lastValidBlockHeight
        }, 'confirmed')
      }
      
      toast.success("Position Closed Successfully!", {
        description: `${enhancedWallet.walletType === 'web3auth' ? 'Social Login' : 'Traditional Wallet'} • Your funds have been withdrawn`,
        action: {
          label: 'View Details',
          onClick: () => {
            // Could link to explorer or refresh page
            refreshPositions()
          },
        },
      })
      
      // Add delay to allow blockchain state to update before refreshing
      setTimeout(() => {
        refreshPositions()
      }, 3000)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      // Enhanced error handling for different wallet types
      if (enhancedWallet.walletType === 'web3auth') {
        if (errorMessage.includes('User rejected') || errorMessage.includes('user denied')) {
          toast.warning('Transaction Cancelled', {
            description: 'You cancelled the transaction in your social wallet.'
          })
          return
        }
      }
      
      // Common error messages
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient lamports')) {
        toast.error('Insufficient Funds', {
          description: 'You need more SOL to complete this transaction.'
        })
      } else if (errorMessage.includes('Failed to initialize DLMM pool')) {
        toast.error('Pool Connection Failed', {
          description: 'Unable to connect to the liquidity pool. Please try refreshing.'
        })
      } else {
        toast.error("Failed to close position", {
          description: errorMessage
        })
      }
      
      // Only log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Close position error:', err)
      }
    } finally {
      setClosing(false)
    }
  }

  const handleClaimFees = async () => {
    if (!enhancedWallet.isConnected || !enhancedWallet.publicKey) {
      toast.error('Please connect your wallet', {
        description: 'Connect either a traditional Solana wallet or use social login'
      })
      return
    }

    setClaiming(true)
    
    try {
      const posKey = pos.publicKey
      const user = enhancedWallet.publicKey
      
      const customRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || connection.rpcEndpoint
      const closeConnection = customRpcUrl !== connection.rpcEndpoint
        ? new Connection(customRpcUrl, { commitment: 'confirmed' })
        : connection

      // Create DLMM pool instance
      const dlmmPool = await DLMM.create(
        closeConnection,
        new PublicKey(lbPairAddress)
      )
      
      // Get position data
      const position = await dlmmPool.getPosition(posKey)
      
      // Create claim fees transaction
      const tx = await dlmmPool.claimSwapFee({
        owner: user,
        position,
      })
      
      if (tx) {
        if (Array.isArray(tx)) {
          // Multiple transactions
          for (const transaction of tx) {
            const block = await closeConnection.getLatestBlockhash('confirmed')
            
            // Set transaction fields safely
            ensureTransactionFields(transaction as TransactionLike, block, user)

            // Use enhanced wallet signing with type casting
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const signature = await enhancedWallet.signAndSendTransaction(transaction as any, closeConnection)
            
            await closeConnection.confirmTransaction({
              signature,
              blockhash: block.blockhash,
              lastValidBlockHeight: block.lastValidBlockHeight
            }, 'confirmed')
          }
        } else {
          // Single transaction
          const block = await closeConnection.getLatestBlockhash('confirmed')
          
          // Set transaction fields safely
          ensureTransactionFields(tx as TransactionLike, block, user)

          // Use enhanced wallet signing with type casting
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const signature = await enhancedWallet.signAndSendTransaction(tx as any, closeConnection)
          
          await closeConnection.confirmTransaction({
            signature,
            blockhash: block.blockhash,
            lastValidBlockHeight: block.lastValidBlockHeight
          }, 'confirmed')
        }
        
        toast.success("Fees Claimed Successfully!", {
          description: `${enhancedWallet.walletType === 'web3auth' ? 'Social Login' : 'Traditional Wallet'} • Your fees have been claimed`,
        })
        
        // Add delay to allow blockchain state to update before refreshing
        setTimeout(() => {
          refreshPositions()
        }, 3000)
      } else {
        toast.error("No fees to claim", {
          description: "You don't have any unclaimed fees for this position."
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      
      // Enhanced error handling for different wallet types
      if (enhancedWallet.walletType === 'web3auth') {
        if (errorMessage.includes('User rejected') || errorMessage.includes('user denied')) {
          toast.warning('Transaction Cancelled', {
            description: 'You cancelled the transaction in your social wallet.'
          })
          return
        }
      }
      
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient lamports')) {
        toast.error('Insufficient Funds', {
          description: 'You need more SOL to complete this transaction.'
        })
      } else {
        toast.error("Failed to claim fees", {
          description: errorMessage
        })
      }
      
      // Only log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Claim fees error:', err)
      }
    } finally {
      setClaiming(false)
    }
  }

  return {
    closing,
    claiming,
    handleCloseAndWithdraw,
    handleClaimFees,
    walletType: enhancedWallet.walletType,
    isConnected: enhancedWallet.isConnected,
    publicKey: enhancedWallet.publicKey,
  }
}