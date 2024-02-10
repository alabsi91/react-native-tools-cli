export const cmd_script = fileName => `
@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\\node.exe" (
  SET "_prog=%dp0%\\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%${fileName}" %*
`;

export const ps1_script = fileName => `#!/usr/bin/env pwsh
$basedir = Split-Path $MyInvocation.MyCommand.Definition -Parent

$exe = ""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  # Fix case when both the Windows and Linux builds of Node
  # are installed in the same directory
  $exe = ".exe"
}
$ret = 0
if (Test-Path "$basedir/node$exe") {
  # Support pipeline input
  if ($MyInvocation.ExpectingInput) {
    $input | & "$basedir/node$exe"  "$basedir/${fileName}" $args
  }
  else {
    & "$basedir/node$exe"  "$basedir/${fileName}" $args
  }
  $ret = $LASTEXITCODE
}
else {
  # Support pipeline input
  if ($MyInvocation.ExpectingInput) {
    $input | & "node$exe"  "$basedir/${fileName}" $args
  }
  else {
    & "node$exe"  "$basedir/${fileName}" $args
  }
  $ret = $LASTEXITCODE
}
exit $ret
`;

export const sh_script = fileName => `
#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")

case \`uname\` in
    *CYGWIN*|*MINGW*|*MSYS*) basedir=\`cygpath -w "$basedir"\`;
esac

if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/${fileName}" "$@"
else 
  exec node  "$basedir/${fileName}" "$@"
fi
`;
