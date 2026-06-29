@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Beyza English Academy başlatılıyor...
where py >nul 2>nul
if %errorlevel%==0 (
  py server.py
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  python server.py
  goto :eof
)
where node >nul 2>nul
if %errorlevel%==0 (
  node server.js
  goto :eof
)
echo Uygulamayı başlatmak için Python veya Node.js gereklidir.
echo Python: https://www.python.org/downloads/
pause
