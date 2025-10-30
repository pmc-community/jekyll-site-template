@echo off
setlocal enabledelayedexpansion
cls

echo.
echo ==================================================
echo   HOLD ON!!! START WORKING ...
echo ==================================================

REM =========================
REM PYTHON PRE-BUILD SCRIPTS
REM =========================
echo.
echo [PY pre-build scripts]
call tools_py\preBuild-pyScripts.bat 2>nul || python tools_py\preBuild-pyScripts.py

REM =========================
REM PRE-FLIGHT CHECKS
REM =========================
echo.
echo [Doing pre-flight site check]
echo HEADS UP!!! PRE-FLIGHT CHECK WILL NOT RUN WHEN BUILDING IN PRODUCTION, IT IS ONLY FOR DEV ...
call check.bat false 2>nul || call check false

REM =========================
REM BUILD START
REM =========================
echo.
echo [Time to build the site. Sit back and relax ...]
echo.

REM If you use a virtual environment for Python (e.g., py 3.9.2)
REM Uncomment and adjust the path if needed
call %USERPROFILE%\py-dev-env-392\Scripts\activate.bat

REM =========================
REM CLEAN AND BUILD JEKYLL SITE
REM =========================
echo Cleaning Jekyll build...
call bundle exec jekyll clean

echo.
echo Building Jekyll site (incremental mode)...
set LANG=en_US.UTF-8
set LC_ALL=en_US.UTF-8
call bundle exec jekyll build --incremental --trace

REM =========================
REM PYTHON POST-BUILD SCRIPTS
REM =========================
echo.
echo [PY post-build scripts]
call tools_py\postBuild-pyScripts.bat 2>nul || python tools_py\postBuild-pyScripts.py

echo.
echo ==================================================
echo   BUILD COMPLETE!
echo ==================================================
endlocal
pause
