# Jupiter Solana React widget

<p align="center">
  <a href="https://boson.son">Provided by: Boson! (boson.so)</a>
  <br/>
  A ready for production Jupiter React component.
</p>
<br/>

## Getting Started

1. Install the react package and Jupiter deps

```
yarn add @bosonso/react-jup-ag
yarn add @jup-ag/react-hook
```

2. Wrap your app with JupiterProvider like so:

```
import { JupiterProvider } from '@jup-ag/react-hook';
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://solana-api.projectserum.com');

const App = ({ children }) => {
  const wallet = useWallet() // user wallet
  return (
    <JupiterProivder connection={connection} cluster="mainnet-beta" userPublicKey={wallet.publicKey}>
      {children}
    </JupiterProvider>
  )
}
```

3. Import React Jupiter and use it on your app:

```
import JupiterForm from '@boson-so/react-jup';

const connection = new Connection('https://solana-api.projectserum.com');

const SwapScreen = ({ children }) => {
  return (
    <JupiterForm />
  )
}
```

## Demo: https://boson.so/swap
