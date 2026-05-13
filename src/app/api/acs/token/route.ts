import { NextResponse } from 'next/server';
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { auth } from '@/lib/auth';

let _client: CommunicationIdentityClient | null = null;

function getClient() {
  if (!process.env.ACS_CONNECTION_STRING) return null;
  if (!_client) _client = new CommunicationIdentityClient(process.env.ACS_CONNECTION_STRING);
  return _client;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getClient();
  if (!client) return NextResponse.json({ error: 'ACS not configured' }, { status: 503 });

  const user = await client.createUser();
  const { token, expiresOn } = await client.getToken(user, ['voip']);

  return NextResponse.json({ userId: user.communicationUserId, token, expiresOn });
}
