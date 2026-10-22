@echo off
title Ossa - build for the App Store
cd /d "%~dp0"
echo.
echo  Building the new Ossa for iPhone and sending it to App Store Connect.
echo  This takes about 30-60 minutes (longer if the Expo queue is busy).
echo  It is NOT a submission for review: the build only shows up in TestFlight
echo  until you choose to submit it.
echo.
echo  If it asks you to log in to Expo, type your Expo email and password.
echo  If it asks to log in to your Apple account, choose Yes and type your Apple
echo  Developer email and password, then the 6-digit code from your iPhone.
echo  You type these yourself. Never send them to anyone, Claude included.
echo  If it asks to generate a certificate, a provisioning profile or an
echo  App Store Connect API key, choose Yes.
echo  If it asks about Push Notifications, choose No.
echo.
call node scripts\build-html.js
if errorlevel 1 goto failed
call npx -y eas-cli@latest build --platform ios --profile production --auto-submit
if errorlevel 1 goto buildfailed
echo.
echo  Done. Apple takes about 15-30 minutes to process the build. It then shows
echo  in App Store Connect, under Ossa: Body Map, TestFlight.
echo  Tell Claude it is uploaded.
echo.
pause
exit /b 0
:buildfailed
echo.
echo  The build or the upload failed. Tell Claude, who will check the log on expo.dev.
pause
exit /b 1
:failed
echo.
echo  Building the app page failed. Send Claude a screenshot of this window.
pause
exit /b 1
