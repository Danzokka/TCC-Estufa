"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  WifiIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

interface DeviceConfig {
  deviceName: string;
  deviceIp: string;
  description?: string;
}

interface DeviceIpConfigProps {
  onConfigSaved?: (config: DeviceConfig) => void;
}

const STORAGE_KEY = "pump_device_config";

export function DeviceIpConfig({ onConfigSaved }: DeviceIpConfigProps) {
  const [config, setConfig] = useState<DeviceConfig>({
    deviceName: "",
    deviceIp: "",
    description: "",
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [savedConfig, setSavedConfig] = useState<DeviceConfig | null>(null);

  // Load saved configuration on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        setSavedConfig(parsedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error("Error loading saved config:", error);
      }
    }
  }, []);

  const testConnection = async () => {
    if (!config.deviceIp) {
      toast.error("Digite o IP do dispositivo");
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus("idle");

    try {
      // Test connection by calling the ESP32 status endpoint
      const response = await fetch(
        `http://${config.deviceIp}:8080/pump/status`,
        {
          method: "GET",
          mode: "cors",
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        setConnectionStatus("success");
        toast.success("Conexão estabelecida com sucesso!");
      } else {
        setConnectionStatus("error");
        toast.error("Dispositivo não respondeu corretamente");
      }
    } catch (error) {
      setConnectionStatus("error");
      toast.error(
        "Não foi possível conectar ao dispositivo. Verifique o IP e se o dispositivo está online."
      );
      console.error("Connection error:", error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConfiguration = () => {
    if (!config.deviceName || !config.deviceIp) {
      toast.error("Preencha o nome e IP do dispositivo");
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(config.deviceIp)) {
      toast.error("Formato de IP inválido");
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSavedConfig(config);
      toast.success("Configuração salva com sucesso!");
      onConfigSaved?.(config);
    } catch (error) {
      toast.error("Erro ao salvar configuração");
      console.error("Error saving config:", error);
    }
  };

  const clearConfiguration = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedConfig(null);
    setConfig({ deviceName: "", deviceIp: "", description: "" });
    setConnectionStatus("idle");
    toast.success("Configuração removida");
  };

  const loadSavedConfig = () => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CogIcon className="h-5 w-5" />
          Configuração do Dispositivo
        </CardTitle>
        <CardDescription>
          Configure o IP do seu ESP32 para controle direto da bomba
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedConfig && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Configuração Salva
                </p>
                <p className="text-sm text-green-600">
                  {savedConfig.deviceName} - {savedConfig.deviceIp}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSavedConfig}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Usar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="deviceName">Nome do Dispositivo</Label>
          <Input
            id="deviceName"
            placeholder="Ex: Bomba Estufa 1"
            value={config.deviceName}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, deviceName: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviceIp">IP do ESP32</Label>
          <div className="flex gap-2">
            <Input
              id="deviceIp"
              placeholder="192.168.1.100"
              value={config.deviceIp}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, deviceIp: e.target.value }))
              }
            />
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={isTestingConnection || !config.deviceIp}
              className="flex-shrink-0"
            >
              {isTestingConnection ? (
                <WifiIcon className="h-4 w-4 animate-pulse" />
              ) : connectionStatus === "success" ? (
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              ) : connectionStatus === "error" ? (
                <XCircleIcon className="h-4 w-4 text-red-600" />
              ) : (
                <WifiIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Input
            id="description"
            placeholder="Localização ou notas sobre o dispositivo"
            value={config.description}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={saveConfiguration}
            disabled={!config.deviceName || !config.deviceIp}
            className="flex-1"
          >
            Salvar Configuração
          </Button>
          {savedConfig && (
            <Button
              variant="outline"
              onClick={clearConfiguration}
              className="text-red-600 hover:bg-red-50"
            >
              Limpar
            </Button>
          )}
        </div>

        {connectionStatus === "success" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Dispositivo conectado e funcionando corretamente!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
