-- CreateTable
CREATE TABLE "urlShortener" (
    "id" SERIAL NOT NULL,
    "fullUrl" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "urlShortener_pkey" PRIMARY KEY ("id")
);
