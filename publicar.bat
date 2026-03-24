@echo off
title Publicar SGFI

cd /d "%~dp0"

echo.
echo ==========================================
echo    PUBLICAR SGFI - VERCEL
echo ==========================================
echo.

echo Digite a mensagem do commit:
set /p MSG=^> 

if "%MSG%"=="" set MSG=deploy: atualizacao

echo.
echo [1/4] git add...
git add .

echo [2/4] git commit...
git commit -m "%MSG%"

echo [3/4] git push...
git push

echo [4/4] vercel deploy...
call vercel --prod

echo.
echo Deploy concluido!
echo.
pause