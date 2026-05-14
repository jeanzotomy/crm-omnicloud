import { createRemoteJWKSet, jwtVerify } from 'jose';

const TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? '';
const JWKS_URI = `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`;
const ISSUER = `https://login.microsoftonline.com/${TENANT_ID}/v2.0`;
// Audience: CRM App Registration ID — Contact Center presents tokens addressed to the CRM resource
const CRM_APP_ID = process.env.AZURE_AD_CLIENT_ID ?? '83802945-b2c2-4fd5-ad44-cf0e41fb52e9';

const jwks = createRemoteJWKSet(new URL(JWKS_URI));

export async function validateAzureAdBearer(req: { headers: { get(name: string): string | null } }): Promise<{ sub: string } | null> {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const token = authorization.slice(7);
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: CRM_APP_ID,
    });
    return { sub: payload.sub ?? '' };
  } catch {
    return null;
  }
}
