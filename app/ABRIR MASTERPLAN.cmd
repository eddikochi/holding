@echo off
chcp 65001 >nul
title Masterplan Sao Borja - NAO FECHE esta janela enquanto usar o app
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  ERRO: nao encontrei o Node.js em C:\Program Files\nodejs
  echo  Avise o desenvolvedor. O app nao pode iniciar sem ele.
  echo.
  pause
  exit /b
)

echo.
echo   ============================================
echo     MASTERPLAN SAO BORJA
echo   ============================================
echo.
echo   Iniciando... aguarde alguns segundos.
echo   Uma aba do navegador vai abrir sozinha.
echo.
echo   IMPORTANTE:
echo   - Deixe ESTA janela preta aberta enquanto usar o app.
echo   - Para DESLIGAR o app, feche esta janela.
echo.

node "node_modules\vite\bin\vite.js" --open

echo.
echo   O app foi encerrado. Pode fechar esta janela.
pause
