import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useMemo } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from '@web3auth/modal/react'
import { useSolanaWallet, useSignAndSendTransaction } from '@web3auth/modal/react/solana'

// Import Web3Auth transaction types to avoid conflicts
import type { TransactionOrVersionedTransaction } from '@web3auth/modal'

interface EnhancedWalletState {
  isConnected: boolean
  publicKey: PublicKey | null
  walletType: 'traditional' | 'web3auth' | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signAndSendTransaction: (transaction: TransactionOrVersionedTransaction, connection?: Connection) => Promise<string>
  canTransact: boolean
  userInfo?: Record<string, unknown> | null
}

export function useEnhancedWallet(): EnhancedWalletState {
  // Traditional wallet
  const {
    publicKey: traditionalPublicKey,
    connected: traditionalConnected,
    wallet: traditionalWallet,
    connect: traditionalConnect,
    disconnect: traditionalDisconnect,
    sendTransaction: traditionalSendTransaction
  } = useWallet()

  // Web3Auth hooks
  const { isConnected: web3AuthConnected, connect: web3AuthConnect } = useWeb3AuthConnect()
  const { disconnect: web3AuthDisconnect } = useWeb3AuthDisconnect()
  const { userInfo } = useWeb3AuthUser()
  const { accounts, connection: web3AuthConnection } = useSolanaWallet()
  const { signAndSendTransaction: web3AuthSignAndSend } = useSignAndSendTransaction()

  // Determine active wallet
  const walletState = useMemo(() => {
    if (traditionalConnected && traditionalPublicKey) {
      return {
        isConnected: true,
        walletType: 'traditional' as const,
        publicKey: traditionalPublicKey
      }
    }
    
    if (web3AuthConnected && accounts?.[0]) {
      return {
        isConnected: true,
        walletType: 'web3auth' as const,
        publicKey: new PublicKey(accounts[0])
      }
    }
    
    return {
      isConnected: false,
      walletType: null,
      publicKey: null
    }
  }, [traditionalConnected, traditionalPublicKey, web3AuthConnected, accounts])

  // Connect function
  const connect = useCallback(async () => {
    if (traditionalWallet) {
      await traditionalConnect()
    } else {
      await web3AuthConnect()
    }
  }, [traditionalWallet, traditionalConnect, web3AuthConnect])

  // Disconnect function
  const disconnect = useCallback(async () => {
    if (walletState.walletType === 'traditional') {
      await traditionalDisconnect()
    } else if (walletState.walletType === 'web3auth') {
      await web3AuthDisconnect()
    }
  }, [walletState.walletType, traditionalDisconnect, web3AuthDisconnect])

  // Transaction signing - Using any type with ESLint exception for library compatibility
  const signAndSendTransaction = useCallback(async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: any,
    connection?: Connection
  ): Promise<string> => {
    if (!walletState.isConnected || !walletState.publicKey) {
      throw new Error('Wallet not connected')
    }

    if (walletState.walletType === 'traditional') {
      // For traditional wallets
      const conn = connection || new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      )
      
      return await traditionalSendTransaction(transaction, conn)
    } else if (walletState.walletType === 'web3auth') {
      // For Web3Auth, cast to unknown first then to expected type to avoid version conflicts
      const web3AuthTransaction = transaction as unknown as Parameters<typeof web3AuthSignAndSend>[0]
      return await web3AuthSignAndSend(web3AuthTransaction)
    }
    
    throw new Error('No suitable wallet for transactions')
  }, [
    walletState.isConnected, 
    walletState.publicKey, 
    walletState.walletType, 
    traditionalSendTransaction,
    web3AuthSignAndSend
  ])

  const canTransact = useMemo(() => {
    return walletState.isConnected && 
           walletState.publicKey !== null && 
           (
             (walletState.walletType === 'traditional' && !!traditionalSendTransaction) ||
             (walletState.walletType === 'web3auth' && !!web3AuthSignAndSend && web3AuthConnection !== null)
           )
  }, [walletState.isConnected, walletState.publicKey, walletState.walletType, traditionalSendTransaction, web3AuthSignAndSend, web3AuthConnection])

  return {
    isConnected: walletState.isConnected,
    publicKey: walletState.publicKey,
    walletType: walletState.walletType,
    connect,
    disconnect,
    signAndSendTransaction,
    canTransact,
    userInfo
  }
}