@description('Base name for the container app resources')
param name string

@description('Azure region')
param location string = resourceGroup().location

@description('Full image reference — e.g. myacr.azurecr.io/crm/app:sha')
param containerImage string

@description('Log Analytics workspace resource ID')
param logAnalyticsWorkspaceId string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('CPU cores allocated (e.g. "0.5")')
param cpuCores string = '0.5'

@description('Memory allocated (e.g. "1Gi")')
param memorySize string = '1Gi'

@description('Minimum replicas')
param minReplicas int = 1

@description('Maximum replicas')
param maxReplicas int = 3

// ── Secrets (passed from main, never hardcoded) ───────────────────────
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
param twilioPhoneNumber string
param twilioWebhookUrl string
@secure()
param resendApiKey string
param emailFrom string
param azureStorageAccountName string
@secure()
param azureStorageAccountKey string
param azureStorageContainer string
param azureAdClientId string
@secure()
param azureAdClientSecret string
param azureAdTenantId string
param defaultOrgId string
@secure()
param emailWebhookSecret string

// ── Container Apps Environment ────────────────────────────────────────
resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${name}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspaceId, '2022-10-01').customerId
        sharedKey: listKeys(logAnalyticsWorkspaceId, '2022-10-01').primarySharedKey
      }
    }
  }
}

// ── Container App ─────────────────────────────────────────────────────
resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: { product: 'crm-omnicloud', component: 'nextjs' }
  properties: {
    managedEnvironmentId: cae.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        allowInsecure: false
        transport: 'http'
        traffic: [{ weight: 100, latestRevision: true }]
      }
      secrets: [
        { name: 'database-url',               value: databaseUrl }
        { name: 'direct-url',                 value: directUrl }
        { name: 'nextauth-secret',             value: nextauthSecret }
        { name: 'twilio-account-sid',          value: twilioAccountSid }
        { name: 'twilio-auth-token',           value: twilioAuthToken }
        { name: 'resend-api-key',              value: resendApiKey }
        { name: 'azure-storage-account-key',   value: azureStorageAccountKey }
        { name: 'azure-ad-client-secret',      value: azureAdClientSecret }
        { name: 'email-webhook-secret',        value: emailWebhookSecret }
      ]
    }
    template: {
      containers: [
        {
          image: containerImage
          name: 'crm'
          resources: { cpu: json(cpuCores), memory: memorySize }
          env: [
            { name: 'NODE_ENV',                        value: 'production' }
            { name: 'DATABASE_URL',                    secretRef: 'database-url' }
            { name: 'DIRECT_URL',                      secretRef: 'direct-url' }
            { name: 'NEXTAUTH_SECRET',                 secretRef: 'nextauth-secret' }
            { name: 'NEXTAUTH_URL',                    value: nextauthUrl }
            { name: 'TWILIO_ACCOUNT_SID',              secretRef: 'twilio-account-sid' }
            { name: 'TWILIO_AUTH_TOKEN',               secretRef: 'twilio-auth-token' }
            { name: 'TWILIO_PHONE_NUMBER',             value: twilioPhoneNumber }
            { name: 'TWILIO_WEBHOOK_URL',              value: twilioWebhookUrl }
            { name: 'RESEND_API_KEY',                  secretRef: 'resend-api-key' }
            { name: 'EMAIL_FROM',                      value: emailFrom }
            { name: 'AZURE_STORAGE_ACCOUNT_NAME',      value: azureStorageAccountName }
            { name: 'AZURE_STORAGE_ACCOUNT_KEY',       secretRef: 'azure-storage-account-key' }
            { name: 'AZURE_STORAGE_CONTAINER',         value: azureStorageContainer }
            { name: 'AZURE_AD_CLIENT_ID',              value: azureAdClientId }
            { name: 'AZURE_AD_CLIENT_SECRET',          secretRef: 'azure-ad-client-secret' }
            { name: 'AZURE_AD_TENANT_ID',              value: azureAdTenantId }
            { name: 'DEFAULT_ORG_ID',                  value: defaultOrgId }
            { name: 'EMAIL_WEBHOOK_SECRET',            secretRef: 'email-webhook-secret' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaler'
            http: { metadata: { concurrentRequests: '50' } }
          }
        ]
      }
    }
  }
}

output containerAppUrl string = 'https://${app.properties.configuration.ingress.fqdn}'
output containerAppName string = app.name
output containerAppEnvironmentId string = cae.id
output fqdn string = app.properties.configuration.ingress.fqdn
