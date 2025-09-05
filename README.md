# Yeeteora

A sophisticated DeFi application for managing Meteora DLMM (Dynamic Liquidity Market Maker) positions on Solana, featuring dual wallet support with both traditional Solana wallets and Web3Auth social login integration.

![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Web3Auth](https://img.shields.io/badge/Web3Auth-10.3.0-00D4FF?style=for-the-badge)

## 🚀 Features

### 🔐 Dual Wallet System
- **Traditional Solana Wallets**: Support for Phantom, Solflare, and all wallet adapter compatible wallets
- **Web3Auth Social Login**: Sign in with Google, Twitter, Discord, Facebook, or Email
- **Unified Interface**: Seamless experience regardless of wallet type
- **Smart Connection Management**: Automatic wallet detection and switching

### 💰 LP Position Management
- **View Positions**: Comprehensive overview of all Meteora DLMM positions
- **Close Positions**: Remove liquidity and withdraw funds with both wallet types
- **Claim Fees**: Harvest accumulated trading fees from LP positions
- **Real-time Data**: Live position tracking with automatic refresh
- **Mobile Responsive**: Optimized for desktop and mobile devices

### 📊 Strategy Filtering
- **One-Sided Strategy**: SOL pairs with strong fundamentals (>$1M market cap, >$2M 24h volume)
- **Smart Filtering**: Advanced criteria for identifying high-performing pairs
- **Live Data**: Real-time pair data from Meteora API
- **Search & Sort**: Find specific pairs and sort by performance metrics

### 🎨 Modern UI/UX
- **Dark Theme**: Sleek cyberpunk-inspired design
- **Responsive Layout**: Mobile-first design with desktop optimization
- **Real-time Updates**: Live data with loading states and error handling
- **Accessible**: WCAG compliant with keyboard navigation support

## 🛠 Tech Stack

### Frontend Framework
- **Next.js 15.3.5** - React framework with App Router
- **TypeScript 5.8.3** - Type-safe development
- **TailwindCSS 4.1.11** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

### Blockchain Integration
- **@solana/web3.js 1.98.2** - Solana blockchain interactions
- **@solana/wallet-adapter** - Traditional wallet support
- **@meteora-ag/dlmm 1.5.5** - Meteora DLMM protocol integration
- **@coral-xyz/anchor 0.31.1** - Solana program framework

### Web3Auth Integration
- **@web3auth/modal 10.3.0** - Social authentication
- **Sapphire Mainnet** - Production-ready Web3Auth network
- **Multiple Providers** - Google, Twitter, Discord, Facebook, Email support

### State Management
- **Jotai 2.12.5** - Atomic state management
- **TanStack Query 5.82.0** - Server state management and caching
- **React Hooks** - Component-level state management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Solana wallet (Phantom, Solflare, etc.) or social account for Web3Auth

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/yeeteora-next.git
   cd yeeteora-next
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Web3Auth Configuration
   NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
   
   # Solana RPC Configuration (Optional but recommended)
   NEXT_PUBLIC_SOLANA_RPC_URL=your_solana_rpc_url
   NEXT_PUBLIC_Custom_RPC_URL=your_custom_rpc_url
   NEXT_PUBLIC_HEAVY_RPC_URL=your_heavy_operations_rpc_url
   ```

4. **Web3Auth Setup**
   - Visit [Web3Auth Dashboard](https://dashboard.web3auth.io/)
   - Create a new project
   - Copy your Client ID to the environment file
   - Configure allowed origins (localhost:3000 for development)

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Web3Auth Configuration

The application uses Web3Auth Sapphire Mainnet with the following configuration:

```typescript
const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    uiConfig: {
      logoLight: '/logo.png',
      logoDark: '/logo.png',
      appName: 'Yeeteora',
      mode: 'dark',
      theme: { primary: '#0066FF' }
    }
  },
}
```

### RPC Configuration

For optimal performance, especially for LP position discovery, configure custom RPC endpoints:

```env
# Primary RPC (Alchemy recommended)
NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Fallback RPCs
NEXT_PUBLIC_Custom_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_HEAVY_RPC_URL=https://your-heavy-operations-rpc.com
```

## 🏗 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── account/             # Account pages
│   ├── meteora/             # Meteora features
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── account/             # Account management
│   │   ├── lp-positions-data-access.tsx
│   │   ├── lp-positions-ui.tsx
│   │   └── profile-stats-card.tsx
│   ├── meteora/             # Meteora integration
│   │   ├── meteora-add-lp-position.tsx
│   │   └── meteora-strategy-filter.tsx
│   ├── solana/              # Wallet providers
│   ├── web3auth/            # Web3Auth integration
│   └── ui/                  # UI components
├── hooks/                   # Custom React hooks
│   └── useEnhancedWallet.ts # Unified wallet hook
└── lib/                     # Utilities
    └── utils.ts
```

## 💡 Key Features Explained

### Unified Wallet System

The application provides a seamless experience for both traditional and social login users:

```typescript
// Traditional Wallet Flow
1. Connect Phantom/Solflare → View Positions → Manage LP

// Web3Auth Social Flow  
1. Sign in with Google/Twitter → View Positions → Manage LP

// Unified Interface
- Same UI for both wallet types
- Consistent transaction flows
- Wallet type indicators
```

### LP Position Management

#### Position Discovery
- Scans all user positions using Meteora DLMM SDK
- Efficient RPC usage with custom endpoints
- Automatic retry and error handling

#### Position Actions
- **Close Position**: Remove 100% liquidity + claim fees
- **Claim Fees**: Harvest accumulated trading fees
- **Real-time Updates**: Position data refreshes automatically

#### Strategy Implementation
- **One-Sided BidAsk**: Places liquidity strategically above/below current price
- **69 Bin Range**: Optimal range for directional trading
- **SOL-Only Deposits**: Simplified single-token liquidity provision

### Enhanced Error Handling

```typescript
// Type-safe error handling
if (enhancedWallet.walletType === 'web3auth') {
  if (errorMessage.includes('User rejected')) {
    toast.warning('Transaction Cancelled', {
      description: 'You cancelled the transaction in your social wallet.'
    })
    return
  }
}
```

## 📱 Mobile Support

The application is fully responsive with:
- **Mobile-first Design**: Optimized for touch interactions
- **Bottom Navigation**: Easy thumb navigation
- **Card Layouts**: Mobile-optimized position cards
- **Touch-friendly Buttons**: Larger touch targets
- **Responsive Tables**: Transform to cards on mobile

## 🔒 Security Features

### Wallet Security
- **No Private Key Storage**: Keys remain in user's wallet
- **Secure Transaction Signing**: All transactions signed by wallet
- **Type-safe Transactions**: TypeScript prevents runtime errors

### RPC Security
- **Multiple Endpoints**: Fallback RPC configuration
- **Rate Limiting**: Built-in retry mechanisms
- **Error Boundaries**: Graceful error handling

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # ESLint checks
pnpm format       # Prettier formatting
pnpm format:check # Check formatting
pnpm ci           # Full CI pipeline (build + lint + format)
```

### Development Features
- **Hot Reload**: Instant updates with Turbopack
- **Type Safety**: Full TypeScript coverage
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Environment Variables**
   Set the following in Vercel dashboard:
   ```
   NEXT_PUBLIC_WEB3AUTH_CLIENT_ID
   NEXT_PUBLIC_SOLANA_RPC_URL
   ```

3. **Domain Configuration**
   Update Web3Auth dashboard with production domain

### Other Platforms

The application can be deployed on any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm ci`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- **TypeScript**: All code must be type-safe
- **ESLint**: Follow established linting rules
- **Prettier**: Use consistent formatting
- **Testing**: Add tests for new features

## 📊 Performance

### Optimization Features
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Splitting**: Automatic code splitting
- **Caching**: Aggressive caching with TanStack Query

### RPC Optimization
- **Connection Pooling**: Efficient RPC usage
- **Retry Logic**: Exponential backoff for failed requests
- **Custom Endpoints**: Dedicated RPCs for heavy operations

## 🐛 Troubleshooting

### Common Issues

**LP Positions Not Loading**
```bash
# Check RPC configuration
console.log('RPC URL:', process.env.NEXT_PUBLIC_SOLANA_RPC_URL)

# Verify wallet connection
console.log('Wallet connected:', isConnected)
console.log('Address:', publicKey?.toString())
```

**Web3Auth Connection Issues**
- Verify client ID in environment variables
- Check Web3Auth dashboard configuration
- Ensure domain is whitelisted

**Transaction Failures**
- Check wallet balance (minimum 0.1 SOL recommended)
- Verify RPC endpoint is working
- Try switching to different RPC

### Debug Mode

Enable development logging:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { ... })
}
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/yeeteora-next/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/yeeteora-next/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/yeeteora-next/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Meteora Protocol** - DLMM infrastructure
- **Web3Auth** - Social authentication solution
- **Solana Labs** - Blockchain infrastructure
- **Open Source Community** - Amazing tools and libraries

---

Built with ❤️ 

![Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square&logo=solana&logoColor=white)
![Web3Auth](https://img.shields.io/badge/Powered%20by-Web3Auth-00D4FF?style=flat-square)
![Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=flat-square&logo=next.js&logoColor=white)