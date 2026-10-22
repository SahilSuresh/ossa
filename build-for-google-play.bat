@echo off
title Ossa - build for Google Play
cd /d "%~dp0"
echo.
echo  Building Ossa for Google Play. This takes about 15-30 minutes.
echo  If it asks you to log in to Expo, type your Expo email and password.
echo  If it asks any yes/no question, press Enter to accept the default.
echo.
call node scripts\build-html.js
if errorlevel 1 goto failed
call npx -y eas-cli@latest build --platform android --profile production
if errorlevel 1 goto buildfailed
echo.
echo  Finished. Download the .aab file from the link above (or from expo.dev).
echo  Then tell Claude it is ready.
echo.
pause
exit /b 0
:buildfailed
echo.
echo  The build failed. Tell Claude, who will check the log on expo.dev.
pause
exit /b 1
:failed
echo.
echo  Building the app page failed. Send Claude a screenshot of this window.
pause
