import React, { useState } from 'react';
import { X, Server, Key, User, Lock, Network, Loader2 } from 'lucide-react';
import axios from 'axios';

interface SSHConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: 'lynis' | 'openscap';
  onConfigured: (connectionId: string) => void;
}

interface SSHConfig {
  host: string;
  port: string;
  username: string;
  authType: 'password' | 'privateKey' | 'generateNew';
  password?: string;
  privateKeyContent?: string;
  passphrase?: string;
  sudoPassword?: string;
  remotePasswordForDeployment?: string;
}

const SSHConfigModal: React.FC<SSHConfigModalProps> = ({ isOpen, onClose, tool, onConfigured }) => {
  const [config, setConfig] = useState<SSHConfig>({
    host: '',
    port: '22',
    username: '',
    authType: 'password',
    password: '',
    privateKeyContent: '',
    passphrase: '',
    sudoPassword: '',
    remotePasswordForDeployment: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleAuthTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAuthType = e.target.value as 'password' | 'privateKey' | 'generateNew';
    setConfig(prev => ({
      ...prev,
      authType: newAuthType,
      password: '',
      privateKeyContent: '',
      passphrase: '',
      remotePasswordForDeployment: '',
    }));
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    console.log('Input clicked:', e.currentTarget.name);
    e.currentTarget.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      let response;
      let connectionId;

      if (config.authType === 'generateNew') {
        if (!config.host || !config.username || !config.remotePasswordForDeployment) {
          throw new Error('Host, username, and remote password are required for key deployment.');
        }
        const deployPayload = {
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.remotePasswordForDeployment,
          sudoPassword: config.sudoPassword,
          passphrase: config.passphrase,
        };
        response = await axios.post('http://localhost:3001/api/ssh/generate-and-deploy-key', deployPayload);
        connectionId = response.data.connectionId;

      } else {
        const connectPayload: any = {
          host: config.host,
          port: config.port,
          username: config.username,
          authType: config.authType,
          sudoPassword: config.sudoPassword,
        };

        if (config.authType === 'password') {
          connectPayload.password = config.password;
        } else {
          connectPayload.privateKeyContent = config.privateKeyContent;
          connectPayload.passphrase = config.passphrase;
        }

        response = await axios.post('http://localhost:3001/api/ssh/connect', connectPayload);
        connectionId = response.data.connectionId;
      }

      if (response.data.status === 'ok') {
        const toolResponse = await axios.post(`http://localhost:3001/api/tools/${tool}/configure-ssh`, {
          connectionId,
          toolType: tool
        });
        
        if (toolResponse.data.status === 'ok') {
          onConfigured(connectionId);
          onClose();
        } else {
          setError(toolResponse.data.message || `Failed to configure ${tool}`);
        }
      } else {
        setError(response.data.message || 'SSH operation failed');
      }
    } catch (error: any) {
      console.error('SSH configuration error:', error);
      setError(error.response?.data?.message || 'Failed to establish SSH connection');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  console.log('Rendering SSH modal for', tool);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-light rounded-lg w-full max-w-md p-6 relative" style={{ zIndex: 100 }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            Configure SSH for {tool === 'lynis' ? 'Lynis' : 'OpenSCAP'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Remote Host *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Server size={16} className="text-neutral-500" />
              </div>
              <input
                type="text"
                name="host"
                value={config.host}
                onChange={handleChange}
                onClick={handleInputClick}
                className="input w-full pl-10 z-10"
                placeholder="e.g., 192.168.1.100 or server.example.com"
                required
                autoFocus
                style={{ zIndex: 10, pointerEvents: 'auto' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              SSH Port
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Network size={16} className="text-neutral-500" />
              </div>
              <input
                type="text"
                name="port"
                value={config.port}
                onChange={handleChange}
                className="input w-full pl-10"
                placeholder="22"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Username *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-neutral-500" />
              </div>
              <input
                type="text"
                name="username"
                value={config.username}
                onChange={handleChange}
                className="input w-full pl-10"
                placeholder="e.g., root or admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Authentication Type *
            </label>
            <div className="flex flex-col space-y-2 mt-2">
              <label className="inline-flex items-center text-neutral-300">
                <input
                  type="radio"
                  name="authType"
                  value="password"
                  checked={config.authType === 'password'}
                  onChange={handleAuthTypeChange}
                  className="form-radio text-primary-500"
                />
                <span className="ml-2">Password (standard, less secure)</span>
              </label>
              <label className="inline-flex items-center text-neutral-300">
                <input
                  type="radio"
                  name="authType"
                  value="privateKey"
                  checked={config.authType === 'privateKey'}
                  onChange={handleAuthTypeChange}
                  className="form-radio text-primary-500"
                />
                <span className="ml-2">Public Key (paste content)</span>
              </label>
              <label className="inline-flex items-center text-neutral-300">
                <input
                  type="radio"
                  name="authType"
                  value="generateNew"
                  checked={config.authType === 'generateNew'}
                  onChange={handleAuthTypeChange}
                  className="form-radio text-primary-500"
                />
                <span className="ml-2">Generate & Deploy New Public Key (easiest)</span>
              </label>
            </div>
          </div>

          {config.authType === 'password' && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-neutral-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={config.password}
                  onChange={handleChange}
                  className="input w-full pl-10"
                  placeholder="SSH password"
                  required={config.authType === 'password'}
                />
              </div>
            </div>
          )}

          {config.authType === 'privateKey' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Private Key Content *
                </label>
                <div className="relative">
                  <textarea
                    name="privateKeyContent"
                    value={config.privateKeyContent}
                    onChange={handleChange}
                    className="input w-full p-3 h-32 resize-y font-mono text-xs"
                    placeholder="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
                    required={config.authType === 'privateKey'}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Paste the full content of your private SSH key (e.g., id_rsa).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Passphrase (if any)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-neutral-500" />
                  </div>
                  <input
                    type="password"
                    name="passphrase"
                    value={config.passphrase}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Private key passphrase"
                  />
                </div>
              </div>
            </>
          )}

          {config.authType === 'generateNew' && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Remote User Password (for key deployment) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-neutral-500" />
                </div>
                <input
                  type="password"
                  name="remotePasswordForDeployment"
                  value={config.remotePasswordForDeployment}
                  onChange={handleChange}
                  className="input w-full pl-10"
                  placeholder="Password on the remote server"
                  required={config.authType === 'generateNew'}
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                This password is used only once to deploy the new public key. It will not be stored.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  New Key Passphrase (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-neutral-500" />
                  </div>
                  <input
                    type="password"
                    name="passphrase"
                    value={config.passphrase}
                    onChange={handleChange}
                    className="input w-full pl-10"
                    placeholder="Passphrase for the new SSH private key"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  A passphrase encrypts the new private key on the server. Highly recommended.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Sudo Password {tool === 'lynis' ? '(Recommended)' : '(Optional)'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-neutral-500" />
              </div>
              <input
                type="password"
                name="sudoPassword"
                value={config.sudoPassword}
                onChange={handleChange}
                className="input w-full pl-10"
                placeholder="Password for sudo commands"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Enter the sudo password if the SSH user requires it to run commands.
            </p>
          </div>

          {error && (
            <div className="text-error-500 text-sm mt-4 p-3 border border-error-500 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-2 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              config.authType === 'generateNew' ? 'Deploy Key & Configure' : 'Connect and Configure'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SSHConfigModal; 