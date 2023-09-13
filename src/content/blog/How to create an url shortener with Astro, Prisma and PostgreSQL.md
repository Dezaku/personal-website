---
title: How to create an url shortener with Astro, Prisma and PostgreSQL
publishedDate: 2023-09-13
description: "In this post we will go trough the process of creating an url shortener with the following tools: Astro, Prisma, PostgreSQL"
tags:
  - astro
  - prisma
  - postgres
  - url
  - shortener
slug: how-to-create-your-own-url-shortener-with-astro-prisma-postgresql
---
Note: This blog post does not go trough the setup part of Prisma. Make sure you know how to set up Prisma with your database to follow this guide.
## Setting up the  Project
To set up an Astro project go to any folder you like and open the cmd in it. Type `npm create astro@latest` at follow the instructions. Then go ahead and set up Astro with SSR by typing `npx astro add node` into the cmd (make sure you're in the path of your Astro project. We also need another page to create our short url links later on. For this we will use the package `nanoid` so you should install it via `npm i nanoid`.

## The Prisma schema
Our prisma schema will have a model named `urlShortener` with an id, the full url, the short url and clicks. It should look like this:
```
model urlShortener {
  id     Int    @id @default(autoincrement())
  fullUrl   String
  shortId  String
  clicks Int    @default(0)
}
```

## Setting up the API
In the "pages" folder of the Astro project create a "api" folder with a file named `shorten.js`. In this file, import the Prisma client like you would normally and create a post function with `url` and `request` as parameters. In this post function you should check if the request is in a JSON type. For now your code should look like this:
```
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function post({ url, request }) {

  if (request.headers.get('Content-Type') === 'application/json') {}}
```
Now get the body of the request and check if there's a JSON object named `fullURL`. If not return the status code 400 to the client. Then create a variable named "shortID" which we now want to give a generated short ID. For this first import our preinstalled package `nanoid` at the top of the file and then define the variable like this: `const shortID = nanoid(10)`. After that, we create a new row in our database with the full url of the request and our newly generated shortID with Prisma like this:
```
await prisma.urlShortener.create({
      data: {
        fullUrl: body.fullURL,
        shortId: shortCode,
      },
    });
```
Now that we created the row in our database, we have to send back a response to the client. We will return a JSON Object with the full url and the created short url (created by getting the origin url of the astro site and adding the shortid after) and the status code for "created" and that's it. This is what your whole code should look like for the `shorten.js`:
```
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { nanoid } from 'nanoid';

export async function post({ url, request }) {
  if (request.headers.get('Content-Type') === 'application/json') {
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
```

# Redirecting to the URL
To now redirect the client to the full url in connection with the shortID, we have to create a `[shortId].js` in the "pages" folder. By doing that a user won't have to type in `url.com/api/shortId` in the browser to get redirected but just `url.com/shortId` like you know it from other url shorteners.
By giving the file a name with a string in brackets we define a parameter in Astro meaning it isn't hardcoded and we can check for the parameter in the file. 
Now in this file again create the Prisma client like you know and create a get function. With the parameters: `params` and `redirect`. What we have to do now is to check if there's a database entry with the client given parameter as shortId in the database. Else return the `404` status code meaning "Not Found". If it is found, update the "clicks" value of the database row (increment it by one) like this:
```
await prisma.urlShortener.updateMany({
      where: { short: params.shortUrl },
      data: { clicks: { increment: 1 } },
    });
```
Now we just have to redirect the user to the fullURL we got from our database entry.
This is how your code should look like at the end:
```
import { PrismaClient } from '@prisma/client';
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
```