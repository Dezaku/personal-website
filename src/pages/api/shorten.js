import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { nanoid } from "nanoid";

export async function post({ url, request }) {
  if (request.headers.get("Content-Type") === "application/json") {
    const body = await request.json();
    if (!body.fullURL) {
      return new Response(null, {
        status: 400,
      });
    }
    const shortID = nanoid(10);
    await prisma.urlShortener.create({
      data: {
        fullUrl: body.fullURL,
        shortId: shortID,
      },
    });
    return new Response(
      JSON.stringify({
        fullURL: body.fullURL,
        shortURL: `${url.origin}/${shortID}`,
      }),
      {
        status: 201,
      }
    );
  }
}
