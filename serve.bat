@echo off
REM Windows equivalent of the bash prebuild script

REM Load colors and global vars (you'll have to implement them manually or remove these lines)
call tools_sh\colors.bat
call tools_sh\globals.bat

cls
echo.
call :print_color BOLD_WHITE "HOLD ON!!! START WORKING ..."
call :print_color BOLD_WHITE "-------------------------------"

REM PYTHON PRE-BUILD SCRIPTS
echo.
call :print_color_enclosed PURPLE "PY pre-build scripts"

for /f "tokens=2 delims=:" %%A in ('findstr "pyEnable" _data\buildConfig.yml') do set pyEnable=%%A
set pyEnable=%pyEnable: =%

if /i "%pyEnable%"=="true" (
    call tools_py\preBuild-pyScripts.bat
) else (
    echo pyEnable is false. Skipping the execution of python scripts. Some site features may not be available.
)

REM PRE-FLIGHT CHECKS
echo.
call :print_color_enclosed PURPLE "Doing pre-flight site check"
echo HEADS UP!!! PRE-FLIGHT CHECK WILL NOT RUN WHEN BUILDING IN PRODUCTION, IT IS ONLY FOR DEV ...

for /f "tokens=2 delims=:" %%B in ('findstr "preFlight" _data\buildConfig.yml') do set preFlight=%%B
set preFlight=%preFlight: =%

if /i "%preFlight%"=="true" (
    call check.bat
) else (
    echo preFlight check is false. Skipping pre-build site checking. You can always run it manually.
)
echo.

call :print_color_enclosed PURPLE "Time to build the site. Sit back and relax ..."

REM ACTIVATE PYTHON ENV
REM Use full path to activate your venv
call %USERPROFILE%\py-dev-env-392\Scripts\activate.bat

REM CLEANING AND BUILDING SITE
bundle exec jekyll clean

REM SERVE THE SITE
set LANG=en_US.UTF-8
set LC_ALL=en_US.UTF-8
bundle exec jekyll serve --incremental --trace --host 0.0.0.0

goto :eof

REM ---- Helper functions ----

:print_color
REM Simulated colored print (implement your own using ANSI if needed)
echo %~2
goto :eof

:print_color_enclosed
REM Simulated colored enclosed print
echo [ %~2 ]
goto :eof
