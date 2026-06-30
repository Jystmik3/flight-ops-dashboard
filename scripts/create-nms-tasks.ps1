#Requires -RunAsAdministrator
$consumerAction = New-ScheduledTaskAction `
  -Execute "C:\Program Files\Java\jdk-25.0.2\bin\java.exe" `
  -Argument "-Dconfig.file=nms-jumpstart.conf -jar `"C:/Users/WetDog/Downloads/jumpstart-latest/lib/jumpstart-jar-with-dependencies.jar`"" `
  -WorkingDirectory "D:\HermesData\flight-ops-dashboard"

$consumerTrigger = New-ScheduledTaskTrigger -AtStartup

$consumerSettings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -RestartCount 10 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName "FlightOps-NMS-Consumer" `
  -Action $consumerAction `
  -Trigger $consumerTrigger `
  -Settings $consumerSettings `
  -RunLevel Highest `
  -User "SYSTEM" `
  -Force

$bridgeAction = New-ScheduledTaskAction `
  -Execute "C:\Program Files\nodejs\node.exe" `
  -Argument "scripts\nms-bridge.js" `
  -WorkingDirectory "D:\HermesData\flight-ops-dashboard"

$bridgeTrigger = New-ScheduledTaskTrigger -AtStartup

$bridgeSettings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -RestartCount 10 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName "FlightOps-NMS-Bridge" `
  -Action $bridgeAction `
  -Trigger $bridgeTrigger `
  -Settings $bridgeSettings `
  -RunLevel Highest `
  -User "SYSTEM" `
  -Force

Write-Output "Scheduled tasks created."
