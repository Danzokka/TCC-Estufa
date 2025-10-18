"use client";

import { useState, useEffect, useCallback } from "react";

interface CaptchaState {
  isRequired: boolean;
  attempts: number;
  lastAttemptTime: number;
  isBlocked: boolean;
  blockUntil: number;
}

const CAPTCHA_THRESHOLD = 3; // Mostrar captcha após 3 tentativas
const BLOCK_DURATION = 5 * 60 * 1000; // Bloquear por 5 minutos após muitas tentativas
const MAX_ATTEMPTS = 5; // Máximo de tentativas antes de bloquear

export const useCaptcha = () => {
  const [captchaState, setCaptchaState] = useState<CaptchaState>({
    isRequired: false,
    attempts: 0,
    lastAttemptTime: 0,
    isBlocked: false,
    blockUntil: 0,
  });

  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  // Verificar se está bloqueado
  const checkBlockStatus = useCallback(() => {
    const now = Date.now();
    if (captchaState.isBlocked && now < captchaState.blockUntil) {
      return true;
    }

    // Se o bloqueio expirou, resetar estado
    if (captchaState.isBlocked && now >= captchaState.blockUntil) {
      setCaptchaState((prev) => ({
        ...prev,
        isBlocked: false,
        blockUntil: 0,
        attempts: 0,
        isRequired: false,
      }));
    }

    return false;
  }, [captchaState.isBlocked, captchaState.blockUntil]);

  // Registrar tentativa de login
  const recordAttempt = useCallback((success: boolean) => {
    const now = Date.now();

    setCaptchaState((prev) => {
      let newAttempts = success ? 0 : prev.attempts + 1;
      let newIsRequired = newAttempts >= CAPTCHA_THRESHOLD;
      let newIsBlocked = prev.isBlocked;
      let newBlockUntil = prev.blockUntil;

      // Se excedeu o máximo de tentativas, bloquear
      if (newAttempts >= MAX_ATTEMPTS) {
        newIsBlocked = true;
        newBlockUntil = now + BLOCK_DURATION;
        newIsRequired = true;
      }

      return {
        isRequired: newIsRequired,
        attempts: newAttempts,
        lastAttemptTime: now,
        isBlocked: newIsBlocked,
        blockUntil: newBlockUntil,
      };
    });
  }, []);

  // Resetar tentativas (quando login é bem-sucedido)
  const resetAttempts = useCallback(() => {
    setCaptchaState((prev) => ({
      ...prev,
      attempts: 0,
      isRequired: false,
      isBlocked: false,
      blockUntil: 0,
    }));
    setIsCaptchaValid(false);
    setCaptchaValue("");
    setCaptchaId("");
  }, []);

  // Verificar se pode tentar login
  const canAttemptLogin = useCallback(() => {
    if (checkBlockStatus()) {
      return false;
    }

    if (captchaState.isRequired && !isCaptchaValid) {
      return false;
    }

    return true;
  }, [checkBlockStatus, captchaState.isRequired, isCaptchaValid]);

  // Obter tempo restante do bloqueio
  const getBlockTimeRemaining = useCallback(() => {
    if (!captchaState.isBlocked) return 0;

    const now = Date.now();
    const remaining = captchaState.blockUntil - now;
    return Math.max(0, remaining);
  }, [captchaState.isBlocked, captchaState.blockUntil]);

  // Formatar tempo restante
  const getFormattedBlockTime = useCallback(() => {
    const remaining = getBlockTimeRemaining();
    if (remaining === 0) return "";

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [getBlockTimeRemaining]);

  // Verificar captcha (compatível com ReCAPTZ)
  const verifyCaptcha = useCallback(
    (isValid: boolean, value?: string, id?: string) => {
      setIsCaptchaValid(isValid);
      if (value) setCaptchaValue(value);
      if (id) setCaptchaId(id);
    },
    []
  );

  // Atualizar valor do captcha
  const updateCaptchaValue = useCallback((value: string) => {
    setCaptchaValue(value);
  }, []);

  return {
    // Estado
    isCaptchaRequired: captchaState.isRequired,
    isBlocked: captchaState.isBlocked,
    attempts: captchaState.attempts,
    canAttemptLogin: canAttemptLogin(),
    blockTimeRemaining: getFormattedBlockTime(),

    // Ações
    recordAttempt,
    resetAttempts,
    verifyCaptcha,
    updateCaptchaValue,

    // Valores
    captchaValue,
    captchaId,
    isCaptchaValid,
  };
};
