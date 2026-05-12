import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const attachments = await prisma.ticketAttachment.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(attachments);
}

// Called after client-side upload to Azure Blob to register the attachment record
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await req.json()) as {
    fileName: string;
    fileSize: number;
    mimeType: string;
    blobUrl: string;
  };

  if (!body.fileName || !body.blobUrl) {
    return NextResponse.json({ error: 'fileName and blobUrl are required' }, { status: 400 });
  }

  const attachment = await prisma.ticketAttachment.create({
    data: {
      ticketId: id,
      uploadedById: session.user.id,
      fileName: body.fileName,
      fileSize: body.fileSize ?? 0,
      mimeType: body.mimeType ?? 'application/octet-stream',
      blobUrl: body.blobUrl,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  await prisma.ticketActivity.create({
    data: {
      ticketId: id,
      userId: session.user.id,
      type: 'attachment_added',
      meta: { fileName: body.fileName },
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { attachmentId } = (await req.json()) as { attachmentId: string };
  const attachment = await prisma.ticketAttachment.findFirst({
    where: { id: attachmentId, ticketId: id },
  });

  if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.ticketAttachment.delete({ where: { id: attachmentId } });
  return new NextResponse(null, { status: 204 });
}
