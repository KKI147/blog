@echo off
title AI & Dev News Dashboard Server
echo ===================================================================
echo   AI ^& Dev News Dashboard Local Web Server Starter
echo ===================================================================
echo.
echo [안내] 브라우저 보안(CORS) 오류 해결을 위해 로컬 웹 서버를 구동합니다.
echo.
echo 1. npx를 사용하여 http-server를 포트 8080으로 실행합니다.
echo 2. 서버가 켜진 뒤 브라우저를 열고 다음 주소로 접속해 주세요.
echo.
echo    ===^> http://localhost:8080
echo.
echo -------------------------------------------------------------------
echo.
npx http-server -p 8080
pause
