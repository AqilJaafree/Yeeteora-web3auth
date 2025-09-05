'use client'

import { useState} from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useGetBalance } from '../account/account-data-access'
import { useEnhancedWallet } from '@/hooks/useEnhancedWallet'

// Import Meteora DLMM SDK
import DLMM, { StrategyType } from '@meteora-ag/dlmm'
import { BN } from '@coral-xyz/anchor'

interface AddLPPositionProps {
  pairAddress: string
  pairName: string
  isSOLPair: boolean
}

export function AddLPPosition({ pairAddress, pairName, isSOLPair }: AddLPPositionProps) {
  const { connection } = useConnection()
  const { sendTransaction } = useWallet()
  
  // Enhanced wallet hook that supports both traditional and Web3Auth wallets
  const enhancedWallet = useEnhancedWallet()
  
  // Traditional wallet hook for balance checking (works with both wallet types)
  const { publicKey: walletPublicKey } = useWallet()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [solAmount, setSolAmount] = useState('')
  const [showStrategyInfo, setShowStrategyInfo] = useState(false)

  // Get wallet balance - use the public key from either wallet type
  const activePublicKey = enhancedWallet.publicKey || walletPublicKey
  const balanceQuery = useGetBalance({ 
    address: activePublicKey || new PublicKey('11111111111111111111111111111111') 
  })
  const walletBalanceSOL = balanceQuery.data && activePublicKey ? balanceQuery.data / LAMPORTS_PER_SOL : 0

  // Function to set percentage of wallet balance
  const setPercentageAmount = (percentage: number) => {
    if (walletBalanceSOL > 0) {
      const amount = (walletBalanceSOL * percentage) / 100
      // Keep some SOL for transaction fees (at least 0.01 SOL)
      const maxUsable = Math.max(0, walletBalanceSOL - 0.01)
      const finalAmount = Math.min(amount, maxUsable)
      setSolAmount(Math.max(0, finalAmount).toFixed(3))
    }
  }

  // Check if this is a SOL pair (SOL as one of the tokens)
  if (!isSOLPair) {
    return null // Only show for SOL pairs
  }

  // Polling-based confirmation method
  const confirmTransactionWithPolling = async (signature: string, maxRetries = 30): Promise<boolean> => {
    console.log('🔄 Starting transaction confirmation with polling...')

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true })

        console.log(`📊 Attempt ${attempt + 1}: Transaction status:`, status.value)

        if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
          if (status.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
          }
          console.log('✅ Transaction confirmed successfully!')
          return true
        }

        if (status.value?.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
        }

        // Wait 2 seconds before next attempt
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.warn(`⚠️ Confirmation attempt ${attempt + 1} failed:`, error)

        // If it's the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          throw error
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    throw new Error('Transaction confirmation timeout after 60 seconds')
  }

  const handleAddPosition = async () => {
    // Check if any wallet is connected using the enhanced wallet hook
    if (!enhancedWallet.isConnected || !enhancedWallet.publicKey || !enhancedWallet.canTransact) {
      toast.error('Please connect your wallet', {
        description: 'Connect either a traditional Solana wallet or use social login'
      })
      return
    }

    if (!solAmount || parseFloat(solAmount) < 0.02) {
      toast.error('Minimum SOL amount is 0.02 SOL')
      return
    }

    setIsLoading(true)

    try {
      console.log('🚀 Creating DLMM pool instance...')
      console.log('💼 Wallet Type:', enhancedWallet.walletType)
      console.log('🔑 Public Key:', enhancedWallet.publicKey.toBase58())

      // Create DLMM pool instance
      const dlmmPool = await DLMM.create(connection, new PublicKey(pairAddress))

      console.log('📍 Getting active bin...')
      // Get active bin information
      const activeBin = await dlmmPool.getActiveBin()

      console.log('🎯 Active bin:', activeBin)

      // Check which token is SOL
      const SOL_MINT = 'So11111111111111111111111111111111111111112'
      const isTokenXSOL = dlmmPool.tokenX.publicKey.toString() === SOL_MINT
      const isTokenYSOL = dlmmPool.tokenY.publicKey.toString() === SOL_MINT

      if (!isTokenXSOL && !isTokenYSOL) {
        throw new Error('This pair does not contain SOL')
      }

      console.log('💰 SOL token detected:', isTokenXSOL ? 'Token X' : 'Token Y')

      // Calculate range for one-sided BidAsk position - exactly 69 bins
      const NUM_BINS = 69
      let minBinId: number
      let maxBinId: number

      if (isTokenXSOL) {
        // SOL is Token X - place bins ABOVE current price for one-sided position
        minBinId = activeBin.binId + 1 // Start 1 bin above current price
        maxBinId = minBinId + (NUM_BINS - 1) // Exactly 69 bins total
      } else {
        // SOL is Token Y - place bins BELOW current price for one-sided position
        maxBinId = activeBin.binId - 1 // End 1 bin below current price
        minBinId = maxBinId - (NUM_BINS - 1) // Exactly 69 bins total
      }

      console.log('📊 One-sided BidAsk position range:', {
        minBinId,
        maxBinId,
        activeBinId: activeBin.binId,
        totalBins: maxBinId - minBinId + 1,
      })

      // Convert SOL amount to lamports
      const solInLamports = new BN(parseFloat(solAmount) * LAMPORTS_PER_SOL)

      // Set amounts for one-sided position (SOL only)
      let totalXAmount: BN
      let totalYAmount: BN

      if (isTokenXSOL) {
        totalXAmount = solInLamports // All SOL goes to X
        totalYAmount = new BN(0) // No Y token
      } else {
        totalXAmount = new BN(0) // No X token
        totalYAmount = solInLamports // All SOL goes to Y
      }

      console.log('💵 Position amounts:', {
        totalXAmount: totalXAmount.toString(),
        totalYAmount: totalYAmount.toString(),
        isTokenXSOL,
        strategy: 'BidAsk one-sided',
      })

      // Generate new position keypair
      const newPosition = new Keypair()
      console.log('🆔 New position address:', newPosition.publicKey.toString())

      // Create one-sided liquidity position with BidAsk strategy
      console.log('📝 Creating BidAsk position transaction...')
      const createPositionTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: newPosition.publicKey,
        user: enhancedWallet.publicKey,
        totalXAmount,
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: StrategyType.BidAsk,
        },
      })

      console.log('📤 Sending transaction...')

      // 🔥 SIMPLIFIED: Handle transaction signing without type conflicts
      let signature: string

      if (enhancedWallet.walletType === 'traditional') {
        // For traditional wallets, use the standard sendTransaction
        if (!sendTransaction) {
          throw new Error('Traditional wallet sendTransaction not available')
        }
        signature = await sendTransaction(createPositionTx, connection, {
          signers: [newPosition],
        })
      } else {
        // For Web3Auth wallets, convert transaction and use direct signing
        try {
          // Pre-sign with the position keypair
          createPositionTx.partialSign(newPosition)
          
          // Set required transaction fields for Web3Auth
          if (!createPositionTx.recentBlockhash) {
            const block = await connection.getLatestBlockhash("finalized")
            createPositionTx.recentBlockhash = block.blockhash
            createPositionTx.lastValidBlockHeight = block.lastValidBlockHeight
          }
          if (!createPositionTx.feePayer) {
            createPositionTx.feePayer = enhancedWallet.publicKey
          }
          
          // Use Web3Auth signing - cast through unknown to avoid type conflicts
          const web3AuthTransaction = createPositionTx as unknown as Parameters<typeof enhancedWallet.signAndSendTransaction>[0]
          signature = await enhancedWallet.signAndSendTransaction(web3AuthTransaction, connection)
        } catch (web3AuthError) {
          console.error('Web3Auth transaction error:', web3AuthError)
          throw web3AuthError
        }
      }

      console.log('✅ Transaction sent:', signature)

      // Use polling-based confirmation
      console.log('⏳ Confirming transaction with polling method...')
      await confirmTransactionWithPolling(signature)

      console.log('🎉 Position created successfully!')
      console.log('📍 Position address:', newPosition.publicKey.toString())

      // Close modal on success
      setIsOpen(false)
      setSolAmount('')

      // Show success toast with wallet type info
      toast.success('LP Position Created Successfully!', {
        description: `${enhancedWallet.walletType === 'web3auth' ? 'Social Login' : 'Traditional Wallet'} • ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}`, '_blank'),
        },
      })
    } catch (err: unknown) {
      console.error('💥 Error creating LP position:', err)
      
      // Enhanced error handling for different wallet types
      let errorMessage = 'Unknown error'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Specific error handling for Web3Auth
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
          toast.error('Failed to create LP position', {
            description: errorMessage
          })
        }
      } else {
        toast.error('Failed to create LP position', {
          description: 'An unexpected error occurred. Please try again.'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Check if any wallet is connected
  const isAnyWalletConnected = enhancedWallet.isConnected

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="lg:w-fit w-full">
          <Plus className="h-4 w-4" />
          Add LP
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] gradient-card flex flex-col bg-background">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">Add Liquidity to {pairName}</DialogTitle>
          {enhancedWallet.isConnected && (
            <p className="text-sm text-muted-foreground">
              Connected via {enhancedWallet.walletType === 'web3auth' ? 'Social Login' : 'Traditional Wallet'}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 px-1 overflow-y-auto flex-1 min-h-0">
          {/* Strategy Section */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-primary">One-Sided BidAsk</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStrategyInfo(!showStrategyInfo)}
                className="h-auto text-muted-foreground hover:text-primary"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
            {showStrategyInfo && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Places your SOL liquidity strategically above or below current price for directional trading. Your SOL
                will only be active when the market moves in your favor.
              </p>
            )}
          </div>

          {/* Wallet Connection Status */}
          {!isAnyWalletConnected && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-200 text-sm">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>Please connect your wallet to continue</span>
              </div>
            </div>
          )}

          {/* Position Form */}
          <div className="space-y-4">
            {/* SOL Amount */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="solAmount" className="text-sm font-medium flex items-center gap-2">
                  SOL Amount
                </Label>
                {activePublicKey && balanceQuery.data && (
                  <span className="text-xs text-sub-text font-serif">Balance: {walletBalanceSOL.toFixed(3)} SOL</span>
                )}
              </div>

              <Input
                id="solAmount"
                type="number"
                placeholder=""
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                min="0.02"
                step="0.01"
                className="text-sm py-3 px-4 rounded-[8px]"
                disabled={!isAnyWalletConnected}
              />

              {/* Percentage Buttons */}
              {activePublicKey && walletBalanceSOL > 0.02 && (
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((percentage) => {
                    const amount = (walletBalanceSOL * percentage) / 100
                    const maxUsable = Math.max(0, walletBalanceSOL - 0.01)
                    const finalAmount = Math.min(amount, maxUsable)

                    return (
                      <Button
                        key={percentage}
                        variant="secondary"
                        size="sm"
                        onClick={() => setPercentageAmount(percentage)}
                        disabled={finalAmount < 0.02 || !isAnyWalletConnected}
                        className="text-xs h-8 border-primary"
                      >
                        {percentage}%
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-quaternary-foreground border border-quaternary p-4">
            <p className="text-sm font-bold text-quaternary">Info</p>
            <span className="font-serif text-sm">Single-sided liquidity means you only provide SOL.</span>
          </div>

          <div className='text-xs font-serif flex flex-col gap-1'>
            <span className='text-sub-text'>SOL needed to create 1 position:</span>
            <span>0.057456080 SOL (Refundable)</span>
          </div>

          {/* Wallet Type Info */}
          {enhancedWallet.isConnected && (
            <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
              <p>✅ Wallet connected via {enhancedWallet.walletType === 'web3auth' ? 'Social Login' : 'Traditional Wallet'}</p>
              <p className="mt-1 font-mono">{enhancedWallet.publicKey?.toBase58().slice(0, 8)}...{enhancedWallet.publicKey?.toBase58().slice(-8)}</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-6 border-t border-border/20 px-1 flex-shrink-0 mt-auto">
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading} className="flex-1 py-3">
              Cancel
            </Button>
            <Button
              onClick={handleAddPosition}
              disabled={isLoading || !enhancedWallet.canTransact}
              className="flex-1 gradient-primary border-0 text-white hover:opacity-90 py-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : !isAnyWalletConnected ? (
                'Connect Wallet First'
              ) : !enhancedWallet.canTransact ? (
                'Wallet Not Ready'
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Position
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}