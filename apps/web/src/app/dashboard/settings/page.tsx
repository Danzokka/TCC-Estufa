import React from "react";
import { getSession } from "@/server/actions/session";
import { getGreenhouseById } from "@/server/actions/greenhouse";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ThemeSwitcher from "@/components/layout/theme-switcher";
import { LocationSettings } from "@/components/settings/location-settings";
import { PWAInstallModal } from "@/components/pwa/pwa-install-modal";
import { Bell, User, Shield, Smartphone } from "lucide-react";

const SettingsPage = async () => {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  // Buscar dados da estufa
  const greenhouseId = "8729d23b-984f-41c5-a4a6-698cd1a9fe18";
  const greenhouse = await getGreenhouseById(greenhouseId);

  return (
    <>
      <SettingsContent greenhouseId={greenhouseId} greenhouse={greenhouse} />
    </>
  );
};

function SettingsContent({
  greenhouseId,
  greenhouse,
}: {
  greenhouseId: string;
  greenhouse: {
    location?: string;
    latitude?: number;
    longitude?: number;
  } | null;
}) {
  return (
    <div className="container mx-auto py-8 px-4 lg:px-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da estufa inteligente
        </p>
      </div>

      <div className="grid gap-6">
        {/* Preferências do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Preferências do Usuário
            </CardTitle>
            <CardDescription>
              Configurações pessoais e preferências de interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema da Interface</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha entre tema claro ou escuro
                </p>
              </div>
              <ThemeSwitcher />
            </div>
          </CardContent>
        </Card>

        {/* Localização da Estufa */}
        <LocationSettings
          greenhouseId={greenhouseId}
          currentLocation={greenhouse?.location || undefined}
          currentLatitude={greenhouse?.latitude || undefined}
          currentLongitude={greenhouse?.longitude || undefined}
        />

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como e quando receber alertas da estufa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Temperatura</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando a temperatura sair do ideal
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Umidade do Solo</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando precisar regar as plantas
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações no seu dispositivo móvel
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Instalação PWA */}
        {/*false && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Instalação como App (PWA)
            </CardTitle>
            <CardDescription>
              Instale a aplicação no seu dispositivo para acesso rápido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📱 Android (Chrome)
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Abra o Chrome no seu Android</li>
                  <li>2. Toque no menu (⋮) no canto superior direito</li>
                  <li>3. Selecione &quot;Adicionar à tela inicial&quot;</li>
                  <li>4. Confirme a instalação</li>
                </ol>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  🍎 iOS (Safari)
                </h4>
                <ol className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>1. Abra o Safari no seu iPhone/iPad</li>
                  <li>2. Toque no botão de compartilhar (□↗)</li>
                  <li>3. Selecione &quot;Adicionar à Tela de Início&quot;</li>
                  <li>4. Confirme a instalação</li>
                </ol>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  💻 Desktop (Chrome/Edge)
                </h4>
                <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>1. Abra Chrome ou Edge no seu computador</li>
                  <li>2. Procure pelo ícone de instalação na barra de endereços</li>
                  <li>3. Clique em &quot;Instalar&quot; quando aparecer</li>
                  <li>4. Confirme a instalação</li>
                </ol>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Dica:</strong> Após a instalação, você poderá acessar a aplicação diretamente 
                da tela inicial do seu dispositivo, como um app nativo!
              </p>
            </div>

          </CardContent>
        </Card>
        */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança e privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Alterar Senha
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Gerenciar Dispositivos Conectados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-4 pt-4">
          <Button>Salvar Configurações</Button>
          <Button variant="outline">Restaurar Padrões</Button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
