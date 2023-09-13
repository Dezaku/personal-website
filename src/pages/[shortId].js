import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function get({ params, redirect }) {
  try {
    const result = await prisma.urlShortener.findFirstOrThrow({
      where: {
        shortId: params.shortId,
      },
    });
    await prisma.urlShortener.updateMany({
      where: { shortId: params.shortUrl },
      data: { clicks: { increment: 1 } },
    });
    return redirect(result.fullUrl, 307);
  } catch (error) {
    return new Response(null, {
      status: 404,
    });
  }
}
