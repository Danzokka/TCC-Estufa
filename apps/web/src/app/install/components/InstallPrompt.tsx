import { Card } from "@/components/ui/card";
import React from "react";

interface InstallPromptProps {
  isIOS: boolean;
  isStandalone: boolean;
}

const Step = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center">
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
};

const InstallIOS = () => {
  return (
    <div className="flex flex-col items-center gap-2 ">
      <Step title="1. Abra o navegador Safari" />
      <Step title="2. Toque no botão de compartilhar" />
      <Step title="3. Toque em 'Adicionar à Tela de Início'" />
      <Step title="4. Toque em 'Adicionar'" />
      <Step title="5. Abra o app a partir da tela inicial" />
    </div>
  );
};

const InstallAndroid = () => {
  return (
    <div className="flex flex-col items-center gap-2 ">
      <Step title="1. Abra o navegador Chrome" />
      <Step title="2. Toque nos três pontos no canto superior direito" />
      <Step title="3. Toque em 'Adicionar à tela inicial'" />
      <Step title="4. Toque em 'Adicionar'" />
      <Step title="5. Abra o app a partir da tela inicial" />
    </div>
  );
};

function InstallPrompt({ isIOS, isStandalone }: InstallPromptProps) {
  const HandleDevice = () => {
    if (isIOS) {
      return <InstallIOS />;
    }
    return <InstallAndroid />;
  };

  if (isStandalone) {
    return null; // Don't show install button if already installed
  }

  return (
    <Card className="p-8 w-full">
      <h2 className="text-foreground font-semibold w-full text-center text-xl">
        Instalando o App
      </h2>
      <HandleDevice />
      {isIOS && (
        <p>
          To install this app on your iOS device, tap the share button
          <span role="img" aria-label="share icon">
            {" "}
            ⎋{" "}
          </span>
          and then &quot;Add to Home Screen&quot;
          <span role="img" aria-label="plus icon">
            {" "}
            +{" "}
          </span>
          .
        </p>
      )}
    </Card>
  );
}

export default InstallPrompt;
