import React from "react";
import { getSession } from "@/server/actions/session";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import {
  Settings2,
  Bell,
  Thermometer,
  Droplets,
  User,
  Shield,
  Clock,
} from "lucide-react";

const SettingsPage = async () => {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

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

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Unidade de Temperatura</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha como exibir as temperaturas
                </p>
              </div>
              <Select defaultValue="celsius">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celsius">°C</SelectItem>
                  <SelectItem value="fahrenheit">°F</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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

        {/* Configurações da Estufa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Configurações da Estufa
            </CardTitle>
            <CardDescription>
              Parâmetros e automação da estufa inteligente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Temperatura Ideal (°C)
                </Label>
                <Select defaultValue="22-26">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-22">18°C - 22°C</SelectItem>
                    <SelectItem value="22-26">22°C - 26°C</SelectItem>
                    <SelectItem value="26-30">26°C - 30°C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Umidade do Solo Ideal (%)
                </Label>
                <Select defaultValue="60-80">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="40-60">40% - 60%</SelectItem>
                    <SelectItem value="60-80">60% - 80%</SelectItem>
                    <SelectItem value="80-90">80% - 90%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Irrigação Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar irrigação automática baseada na umidade do solo
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sistema
            </CardTitle>
            <CardDescription>
              Configurações técnicas e de performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Frequência de Atualização</Label>
                <p className="text-sm text-muted-foreground">
                  Intervalo entre atualizações dos dados dos sensores
                </p>
              </div>
              <Select defaultValue="30">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seg</SelectItem>
                  <SelectItem value="30">30 seg</SelectItem>
                  <SelectItem value="60">1 min</SelectItem>
                  <SelectItem value="300">5 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo de Economia de Energia</Label>
                <p className="text-sm text-muted-foreground">
                  Reduzir consumo de energia dos sensores durante a noite
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
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
                Configurar Autenticação de Dois Fatores
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
};

export default SettingsPage;
