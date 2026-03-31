@echo off
title Publicar SGFI
cd /d "%~dp0"

echo.
echo ==========================================
echo    PUBLICAR SGFI - VERCEL
echo ==========================================
echo.

set /p MSG=Mensagem do commit: 
if "%MSG%"=="" set MSG=deploy: atualizacao

echo.
echo [1/3] Adicionando arquivos...
git add .

echo [2/3] Commitando...
git commit -m "%MSG%"
if %ERRORLEVEL% NEQ 0 (
    echo Nenhuma alteracao para commitar.
    goto push
)

:push
echo [3/3] Enviando para o GitHub...
git push
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao enviar para o GitHub.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Concluido! Deploy automatico em curso.
echo.
echo   Site: https://sgfi-sejuv.vercel.app
echo   Painel: https://vercel.com/dashboard
echo.
echo   O Vercel detecta o push e faz o build
echo   automaticamente em ~1-2 minutos.
echo ==========================================
echo.
pause
