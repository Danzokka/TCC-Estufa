import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  platform: 'android' | 'ios' | 'desktop' | 'unknown';
  showInstallPrompt: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    platform: 'unknown',
    showInstallPrompt: false,
    installPrompt: null,
  });

  useEffect(() => {
    // Detectar plataforma
    const detectPlatform = (): 'android' | 'ios' | 'desktop' | 'unknown' => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (/android/.test(userAgent)) {
        return 'android';
      } else if (/iphone|ipad|ipod/.test(userAgent)) {
        return 'ios';
      } else if (/windows|macintosh|linux/.test(userAgent)) {
        return 'desktop';
      }
      
      return 'unknown';
    };

    // Verificar se já está instalado
    const checkIfInstalled = (): boolean => {
      // Verificar se está rodando em modo standalone (PWA instalado)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // Verificar se está rodando em modo standalone no iOS
      if ((window.navigator as { standalone?: boolean }).standalone === true) {
        return true;
      }
      
      return false;
    };

    // Verificar se deve mostrar o prompt de instalação
    const shouldShowInstallPrompt = (): boolean => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const lastShown = localStorage.getItem('pwa-install-last-shown');
      
      if (dismissed === 'true') {
        return false;
      }
      
      if (lastShown) {
        const lastShownDate = new Date(lastShown);
        const daysSinceLastShown = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Mostrar novamente após 7 dias
        if (daysSinceLastShown < 7) {
          return false;
        }
      }
      
      return true;
    };

    const platform = detectPlatform();
    const isInstalled = checkIfInstalled();
    const showInstallPrompt = shouldShowInstallPrompt();

    setPwaState(prev => ({
      ...prev,
      platform,
      isInstalled,
      showInstallPrompt: showInstallPrompt && !isInstalled,
    }));

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installPrompt = e as BeforeInstallPromptEvent;
      
      setPwaState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt,
      }));
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        showInstallPrompt: false,
        installPrompt: null,
      }));
      
      // Limpar dados de instalação
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-last-shown');
    };

    // Adicionar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Função para mostrar o prompt de instalação
  const triggerInstallPrompt = async () => {
    if (pwaState.installPrompt) {
      await pwaState.installPrompt.prompt();
      const choiceResult = await pwaState.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação do PWA');
      } else {
        console.log('Usuário rejeitou a instalação do PWA');
      }
      
      setPwaState(prev => ({
        ...prev,
        installPrompt: null,
        isInstallable: false,
        showInstallPrompt: false,
      }));
    }
  };

  // Função para não mostrar novamente
  const dismissInstallPrompt = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-last-shown', new Date().toISOString());
    
    setPwaState(prev => ({
      ...prev,
      showInstallPrompt: false,
    }));
  };

  // Função para mostrar novamente (para configurações)
  const enableInstallPrompt = () => {
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-last-shown');
    
    setPwaState(prev => ({
      ...prev,
      showInstallPrompt: true,
    }));
  };

  return {
    ...pwaState,
    triggerInstallPrompt,
    dismissInstallPrompt,
    enableInstallPrompt,
  };
}
