"use client";

import React, { useState } from "react";
import { Captcha } from "recaptz";

interface ReCaptzWrapperProps {
  onVerify: (isValid: boolean, value?: string, id?: string) => void;
  isRequired: boolean;
  isBlocked: boolean;
}

const ReCaptzWrapper: React.FC<ReCaptzWrapperProps> = ({
  onVerify,
  isRequired,
  isBlocked,
}) => {
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaId] = useState(() =>
    Math.random().toString(36).substring(2, 15)
  );

  const handleValidate = (isValid: boolean) => {
    onVerify(isValid, captchaValue, captchaId);
  };

  if (!isRequired || isBlocked) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-foreground/80">
        Por segurança, complete a verificação abaixo:
      </div>
      <Captcha
        type="numbers"
        length={4}
        onValidate={handleValidate}
        validationRules={{
          required: true,
          allowedCharacters: "0123456789",
        }}
        enableAudio={true}
        showSuccessAnimation={true}
        showConfetti={true}
        refreshable={true}
        maxAttempts={3}
        customStyles={{
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        i18n={{
          securityCheck: "Verificação de Segurança",
          inputPlaceholder: "Digite o código",
          verifyButton: "Verificar",
          refreshButton: "Atualizar",
          audioButton: "Ouvir código",
          successMessage: "Verificação bem-sucedida!",
          errorMessage: "Código incorreto. Tente novamente.",
          maxAttemptsReached: "Muitas tentativas. Tente novamente mais tarde.",
        }}
      />
    </div>
  );
};

export default ReCaptzWrapper;
