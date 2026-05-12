import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from '@azure/storage-blob';

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: ticketId } = await params;
  const { fileName, fileSize, mimeType } = (await req.json()) as {
    fileName: string;
    fileSize: number;
    mimeType: string;
  };

  if (!fileName || !mimeType) {
    return NextResponse.json({ error: 'fileName and mimeType required' }, { status: 400 });
  }
  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 25 MB)' }, { status: 413 });
  }
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 415 });
  }

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER ?? 'ticket-attachments';

  if (!accountName || !accountKey) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const blobName = `tickets/${ticketId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('cw'),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      contentType: mimeType,
    },
    credential,
  ).toString();

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );
  // Ensure container exists (idempotent)
  await blobServiceClient.getContainerClient(containerName).createIfNotExists({ access: 'blob' });

  const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
  const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;

  return NextResponse.json({ uploadUrl, blobUrl, blobName });
}
