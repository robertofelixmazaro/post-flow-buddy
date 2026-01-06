import { useState, createContext, useContext, ReactNode } from 'react';
import { NetworkType } from '@/data/mockData';

export interface NetworkConnection {
  id: string;
  network: NetworkType;
  username: string;
  followers: number;
  connected: boolean;
  avatar: string;
}

interface NetworksContextType {
  networks: NetworkConnection[];
  connectNetwork: (networkId: string, username: string) => void;
  disconnectNetwork: (networkId: string) => void;
  getConnectedNetworks: () => NetworkConnection[];
}

const NetworksContext = createContext<NetworksContextType | undefined>(undefined);

const initialNetworks: NetworkConnection[] = [
  { id: '1', network: 'instagram', username: '', followers: 0, connected: false, avatar: '' },
  { id: '2', network: 'facebook', username: '', followers: 0, connected: false, avatar: '' },
  { id: '3', network: 'google', username: '', followers: 0, connected: false, avatar: '' },
  { id: '4', network: 'tiktok', username: '', followers: 0, connected: false, avatar: '' },
  { id: '5', network: 'youtube', username: '', followers: 0, connected: false, avatar: '' },
];

export function NetworksProvider({ children }: { children: ReactNode }) {
  const [networks, setNetworks] = useState<NetworkConnection[]>(initialNetworks);

  const connectNetwork = (networkId: string, username: string) => {
    setNetworks(prev => prev.map(network => 
      network.id === networkId 
        ? { ...network, connected: true, username, followers: 0 }
        : network
    ));
  };

  const disconnectNetwork = (networkId: string) => {
    setNetworks(prev => prev.map(network => 
      network.id === networkId 
        ? { ...network, connected: false, username: '', followers: 0 }
        : network
    ));
  };

  const getConnectedNetworks = () => networks.filter(n => n.connected);

  return (
    <NetworksContext.Provider value={{ networks, connectNetwork, disconnectNetwork, getConnectedNetworks }}>
      {children}
    </NetworksContext.Provider>
  );
}

export function useNetworks() {
  const context = useContext(NetworksContext);
  if (!context) {
    throw new Error('useNetworks must be used within a NetworksProvider');
  }
  return context;
}
