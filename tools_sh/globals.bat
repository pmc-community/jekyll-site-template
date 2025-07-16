@echo off
REM This script defines print_color and print_color_enclosed as callable labels
REM Requires ANSI color variables loaded from colors.bat

goto :eof

:print_color
REM Usage: call :print_color !BOLD_PURPLE! "Hello world"
setlocal EnableDelayedExpansion
set "color=%~1"
set "text=%~2"
echo !color!!text!!NC!
endlocal
goto :eof

:print_color_enclosed
REM Usage: call :print_color_enclosed !BOLD_GREEN! "Building site"
setlocal EnableDelayedExpansion
set "color=%~1"
set "text=%~2"
echo !color!--!text!--!NC!
endlocal
goto :eof
