'use client'

import React from 'react'
import { Web3AuthProvider } from '@web3auth/modal/react'
import { WEB3AUTH_NETWORK } from '@web3auth/modal'
import type { Web3AuthContextConfig } from '@web3auth/modal/react'

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    uiConfig: {
      logoLight: '/logo.png', // Add your logo path
      logoDark: '/logo.png',
      appName: 'Yeeteora',
      mode: 'dark',
      theme: {
        primary: '#0066FF'
      }
    }
  },
}

export function Web3AuthContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      {children}
    </Web3AuthProvider>
  )
}