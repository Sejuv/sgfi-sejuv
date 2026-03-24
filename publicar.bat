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

echo [3/3] Enviando para o GitHub...
git push

echo.
echo Fazendo deploy no Vercel...
npx vercel --prod --yes

echo.
echo ==========================================
echo   Concluido! sgfi-sejuv.vercel.app
echo ==========================================
echo.
pause
