const ps1_script = fileName => `#!/usr/bin/env pwsh
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

export default ps1_script;