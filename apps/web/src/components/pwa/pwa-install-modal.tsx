"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Monitor, 
  Chrome, 
  X,
  CheckCircle,
  Download
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

interface PWAInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PWAInstallModal({ open, onOpenChange }: PWAInstallModalProps) {
  const { 
    platform, 
    isInstalled, 
    isInstallable, 
    showInstallPrompt, 
    dismissInstallPrompt 
  } = usePWA();

  const handleInstall = async () => {
    if (isInstallable) {
      await showInstallPrompt();
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    onOpenChange(false);
  };

  const getPlatformInstructions = () => {
    switch (platform) {
      case 'android':
        return {
          icon: <Smartphone className="h-6 w-6 text-green-600" />,
          title: "📱 Android",
          steps: [
            "Abra o Chrome no seu Android",
            "Toque no menu (⋮) no canto superior direito",
            "Selecione 'Adicionar à tela inicial'",
            "Confirme a instalação"
          ],
          color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
        };
      case 'ios':
        return {
          icon: <Chrome className="h-6 w-6 text-blue-600" />,
          title: "🍎 iOS",
          steps: [
            "Abra o Safari no seu iPhone/iPad",
            "Toque no botão de compartilhar (□↗)",
            "Selecione 'Adicionar à Tela de Início'",
            "Confirme a instalação"
          ],
          color: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
        };
      case 'desktop':
        return {
          icon: <Monitor className="h-6 w-6 text-purple-600" />,
          title: "💻 Desktop",
          steps: [
            "Abra Chrome ou Edge no seu computador",
            "Procure pelo ícone de instalação na barra de endereços",
            "Clique em 'Instalar' quando aparecer",
            "Confirme a instalação"
          ],
          color: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"
        };
      default:
        return {
          icon: <Chrome className="h-6 w-6 text-gray-600" />,
          title: "🌐 Navegador",
          steps: [
            "Procure pelo ícone de instalação na barra de endereços",
            "Clique em 'Instalar' quando aparecer",
            "Confirme a instalação"
          ],
          color: "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800"
        };
    }
  };

  const instructions = getPlatformInstructions();

  if (isInstalled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              App Instalado
            </DialogTitle>
            <DialogDescription>
              O aplicativo já está instalado no seu dispositivo!
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Você pode acessar a aplicação diretamente da tela inicial.
            </p>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            Instalar Aplicativo
          </DialogTitle>
          <DialogDescription>
            Instale a aplicação no seu dispositivo para acesso rápido e melhor experiência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instruções específicas da plataforma */}
          <div className={`p-4 rounded-lg border ${instructions.color}`}>
            <div className="flex items-center gap-2 mb-3">
              {instructions.icon}
              <h4 className="font-semibold">{instructions.title}</h4>
            </div>
            <ol className="text-sm space-y-1">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-medium text-xs bg-white dark:bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Benefícios */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ✨ Benefícios da instalação:
            </h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Acesso rápido da tela inicial</li>
              <li>• Funciona offline</li>
              <li>• Notificações push</li>
              <li>• Experiência de app nativo</li>
            </ul>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            {isInstallable ? (
              <Button onClick={handleInstall} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Instalar Agora
              </Button>
            ) : (
              <Button disabled className="flex-1">
                <Chrome className="h-4 w-4 mr-2" />
                Instalação Manual
              </Button>
            )}
            <Button variant="outline" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Informação adicional */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Você pode instalar a qualquer momento nas configurações
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
