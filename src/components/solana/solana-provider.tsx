// Fixed src/components/solana/solana-provider.tsx
// Better wallet button logic to prevent dual display

'use client'

import { WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from '@web3auth/modal/react'
import { useSolanaWallet } from '@web3auth/modal/react/solana'
import dynamic from 'next/dynamic'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { Button } from '../ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu'
import { ChevronDown, Copy, ExternalLink, LogOut, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import '@solana/wallet-adapter-react-ui/styles.css'

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

// Enhanced Web3Auth Button Component with account management
function Web3AuthWalletButton() {
  const { connect, loading, isConnected } = useWeb3AuthConnect()
  const { disconnect } = useWeb3AuthDisconnect()
  const { accounts } = useSolanaWallet()
  const [isOpen, setIsOpen] = useState(false)

  const handleConnect = useCallback(async () => {
    try {
      await connect()
      toast.success('Connected via Social Login', {
        description: 'Your social wallet is now connected'
      })
    } catch (error) {
      console.error('Web3Auth connection error:', error)
      toast.error('Connection failed', {
        description: 'Please try again or use a different login method'
      })
    }
  }, [connect])

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      toast.success('Disconnected', {
        description: 'Your social wallet has been disconnected'
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Web3Auth disconnect error:', error)
      toast.error('Disconnect failed')
    }
  }, [disconnect])

  const handleCopyAddress = useCallback(() => {
    if (accounts?.[0]) {
      navigator.clipboard.writeText(accounts[0])
      toast.success('Address copied to clipboard')
      setIsOpen(false)
    }
  }, [accounts])

  const handleViewExplorer = useCallback(() => {
    if (accounts?.[0]) {
      window.open(`https://explorer.solana.com/account/${accounts[0]}`, '_blank')
      setIsOpen(false)
    }
  }, [accounts])

  if (isConnected && accounts?.length) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 min-w-[140px] justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="font-mono text-sm">
                {accounts[0].slice(0, 4)}...{accounts[0].slice(-4)}
              </span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-3 py-2">
            <div className="text-xs text-muted-foreground mb-1">Connected via Social Login</div>
            <div className="font-mono text-sm truncate">{accounts[0]}</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewExplorer} className="cursor-pointer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={loading}
      variant="secondary"
      className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500 text-blue-400 hover:from-blue-600/30 hover:to-purple-600/30 min-w-[120px]"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          Connecting...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Social Login
        </div>
      )}
    </Button>
  )
}

// Enhanced Traditional Wallet Button Component
function TraditionalWalletButton() {
  const { connected, publicKey, disconnect } = useWallet()
  const [isOpen, setIsOpen] = useState(false)

  const handleCopyAddress = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString())
      toast.success('Address copied to clipboard')
      setIsOpen(false)
    }
  }, [publicKey])

  const handleViewExplorer = useCallback(() => {
    if (publicKey) {
      window.open(`https://explorer.solana.com/account/${publicKey.toString()}`, '_blank')
      setIsOpen(false)
    }
  }, [publicKey])

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      toast.success('Wallet disconnected')
      setIsOpen(false)
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Disconnect failed')
    }
  }, [disconnect])

  if (connected && publicKey) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="default" 
            className="flex items-center gap-2 min-w-[140px] justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="font-mono text-sm">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-3 py-2">
            <div className="text-xs text-muted-foreground mb-1">Traditional Wallet</div>
            <div className="font-mono text-sm truncate">{publicKey.toString()}</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewExplorer} className="cursor-pointer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
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
  )
}

// FIXED: Combined Wallet Button with Better State Management
export function WalletButton() {
  const { isConnected: web3AuthConnected } = useWeb3AuthConnect()
  const { connected: traditionalConnected } = useWallet()

  // Priority: Show only one wallet type at a time
  // 1. If Web3Auth is connected, show only Web3Auth button
  if (web3AuthConnected) {
    return <Web3AuthWalletButton />
  }
  
  // 2. If traditional wallet is connected, show only traditional button
  if (traditionalConnected) {
    return <TraditionalWalletButton />
  }

  // 3. If neither is connected, show both options
  return (
    <div className="flex items-center gap-2">
      <Web3AuthWalletButton />
      <TraditionalWalletButton />
    </div>
  )
}

// Account Page specific wallet connection component
export function AccountWalletSection() {
  const { isConnected: web3AuthConnected } = useWeb3AuthConnect()
  const { connected: traditionalConnected } = useWallet()
  const { accounts } = useSolanaWallet()

  const isAnyWalletConnected = web3AuthConnected || traditionalConnected

  if (isAnyWalletConnected) {
    return (
      <div className="bg-gradient-card rounded-xl p-6 border border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Wallet Connection</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Connected via {web3AuthConnected ? 'Social Login' : 'Traditional Wallet'}
              </span>
            </div>
            {web3AuthConnected && accounts?.[0] && (
              <div className="font-mono text-sm text-white mt-1">
                {accounts[0].slice(0, 8)}...{accounts[0].slice(-8)}
              </div>
            )}
          </div>
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-card rounded-xl p-8 border border-border/20 text-center">
      <Wallet className="w-12 h-12 text-white mx-auto mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">Connect Your Wallet</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        Connect your wallet to view and manage your LP positions. Choose between traditional Solana wallets or social login.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Web3AuthWalletButton />
        <span className="text-muted-foreground text-sm">or</span>
        <TraditionalWalletButton />
      </div>
    </div>
  )
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const onError = useCallback((error: WalletError) => {
    console.error('Wallet Error:', error)
    toast.error('Wallet Error', {
      description: error.message
    })
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}