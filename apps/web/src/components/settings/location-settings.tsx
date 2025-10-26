"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { updateGreenhouseLocationFromCoords } from "@/server/actions/greenhouse";
import dynamic from "next/dynamic";

// Importar mapa dinamicamente (client-side only)
const LocationMap = dynamic(
  () => import("./location-map").then((mod) => ({ default: mod.LocationMap })),
  { ssr: false, loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" /> }
);

interface LocationSettingsProps {
  greenhouseId: string;
  currentLocation?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

export function LocationSettings({
  greenhouseId,
  currentLocation,
  currentLatitude,
  currentLongitude,
}: LocationSettingsProps) {
  const [location, setLocation] = useState(currentLocation || "");
  const [latitude, setLatitude] = useState(currentLatitude || -15.7942);
  const [longitude, setLongitude] = useState(currentLongitude || -47.8825);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [tempLatitude, setTempLatitude] = useState(currentLatitude || -15.7942);
  const [tempLongitude, setTempLongitude] = useState(currentLongitude || -47.8825);

  const handleDetectLocation = useCallback(async () => {
    setIsDetecting(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { latitude: lat, longitude: lon } = position.coords;
      setLatitude(lat);
      setLongitude(lon);
      setTempLatitude(lat);
      setTempLongitude(lon);
      setShowMap(true);
      
      // Obter nome do estado
      const result = await updateGreenhouseLocationFromCoords(greenhouseId, lat, lon);
      if (result.success) {
        setLocation(result.stateName);
        toast.success(`Localização detectada: ${result.stateName}`);
      }
    } catch (error) {
      console.error("Erro ao detectar localização:", error);
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Permissão de localização negada. Por favor, permita o acesso.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Localização não disponível");
            break;
          case error.TIMEOUT:
            toast.error("Tempo limite excedido ao detectar localização");
            break;
        }
      } else {
        toast.error("Erro ao detectar localização");
      }
    } finally {
      setIsDetecting(false);
    }
  }, [greenhouseId]);

  const handleMapLocationChange = useCallback((lat: number, lon: number) => {
    setTempLatitude(lat);
    setTempLongitude(lon);
  }, []);

  const handleSaveLocation = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const result = await updateGreenhouseLocationFromCoords(greenhouseId, tempLatitude, tempLongitude);
      if (result.success) {
        setLatitude(tempLatitude);
        setLongitude(tempLongitude);
        setLocation(result.stateName);
        toast.success(`Localização salva: ${result.stateName}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Erro ao salvar localização:", error);
      toast.error("Erro ao salvar localização");
    } finally {
      setIsSaving(false);
    }
  }, [greenhouseId, tempLatitude, tempLongitude]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Localização da Estufa
        </CardTitle>
        <CardDescription>
          Detecte sua localização automaticamente e ajuste no mapa se necessário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações da localização atual */}
        {location && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{location}</p>
                <p className="text-xs text-muted-foreground">
                  Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão de detecção */}
        <Button
          onClick={handleDetectLocation}
          disabled={isDetecting}
          className="w-full"
          size="lg"
        >
          {isDetecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Detectando...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Detectar Localização Automaticamente
            </>
          )}
        </Button>

        {/* Mapa interativo */}
        {showMap && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ajuste a Localização no Mapa</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Arraste o marcador para ajustar sua localização exata
              </p>
              <LocationMap
                latitude={tempLatitude}
                longitude={tempLongitude}
                onLocationChange={handleMapLocationChange}
              />
            </div>
            
            {/* Coordenadas atuais */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Coordenadas Selecionadas:</p>
              <p className="text-xs text-muted-foreground">
                {tempLatitude.toFixed(6)}, {tempLongitude.toFixed(6)}
              </p>
            </div>
            
            {/* Botão de salvar */}
            <Button
              onClick={handleSaveLocation}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Localização
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
