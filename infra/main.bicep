@description('Base name — used as prefix for all resources (e.g. "crm-prod")')
param appName string = 'crm-prod'

@description('Azure region')
param location string = resourceGroup().location

@description('Container image reference — set by CI/CD')
param containerImage string = 'mcr.microsoft.com/azuredocs/aci-helloworld:latest'

@description('Number of CPU cores')
param cpuCores string = '0.5'

@description('Memory')
param memorySize string = '1Gi'

@description('Min replicas')
param minReplicas int = 1

@description('Max replicas')
param maxReplicas int = 3

// ── ACR credentials ──────────────────────────────────────────────────
param acrLoginServer string = 'acrcrmomnicloud.azurecr.io'
param acrUsername string = 'acrcrmomnicloud'
@secure()
param acrPassword string

// ── Secrets (injected by CI/CD or azd, never committed) ──────────────
@secure()
param databaseUrl string
@secure()
param directUrl string
@secure()
param nextauthSecret string
param nextauthUrl string
@secure()
param twilioAccountSid string
@secure()
param twilioAuthToken string
param twilioPhoneNumber string = '+16413484830'
param twilioWebhookUrl string = ''
@secure()
param resendApiKey string
param emailFrom string = 'support@cloudmature.com'
param azureStorageAccountName string = 'crmomnicloud'
@secure()
param azureStorageAccountKey string
param azureStorageContainer string = 'ticket-attachments'
param azureAdClientId string = '83802945-b2c2-4fd5-ad44-cf0e41fb52e9'
@secure()
param azureAdClientSecret string
param azureAdTenantId string = '9fe00940-ea78-4e36-906f-39fc7636e703'
param defaultOrgId string = 'org-demo'
@secure()
param emailWebhookSecret string = ''

// ── Monitoring ────────────────────────────────────────────────────────
module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    name: appName
    location: location
  }
}

// ── Container App ─────────────────────────────────────────────────────
module containerApp 'modules/container-app.bicep' = {
  name: 'container-app'
  params: {
    name: appName
    location: location
    containerImage: containerImage
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    cpuCores: cpuCores
    memorySize: memorySize
    minReplicas: minReplicas
    maxReplicas: maxReplicas
    databaseUrl: databaseUrl
    directUrl: directUrl
    nextauthSecret: nextauthSecret
    nextauthUrl: nextauthUrl
    twilioAccountSid: twilioAccountSid
    twilioAuthToken: twilioAuthToken
    twilioPhoneNumber: twilioPhoneNumber
    twilioWebhookUrl: twilioWebhookUrl
    resendApiKey: resendApiKey
    emailFrom: emailFrom
    azureStorageAccountName: azureStorageAccountName
    azureStorageAccountKey: azureStorageAccountKey
    azureStorageContainer: azureStorageContainer
    azureAdClientId: azureAdClientId
    azureAdClientSecret: azureAdClientSecret
    azureAdTenantId: azureAdTenantId
    defaultOrgId: defaultOrgId
    emailWebhookSecret: emailWebhookSecret
    acrLoginServer: acrLoginServer
    acrUsername: acrUsername
    acrPassword: acrPassword
  }
}

// ── Outputs ───────────────────────────────────────────────────────────
output appUrl string = containerApp.outputs.containerAppUrl
output fqdn string = containerApp.outputs.fqdn
output appInsightsConnectionString string = monitoring.outputs.appInsightsConnectionString
