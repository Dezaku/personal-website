---
title: How to create your own authentication system with Astro and Prisma
publishedDate: 2023-08-30
description: In this post I show you how to create your own authentication system with Astro and Prisma + PostgresSQL while also explaining the code.
tags: ["astro", "prisma", "postgres", "auth"]
slug: how-to-create-your-own-authentication-system-with-astro-and-prisma+postgresql
---

Note: This blog post does not go trough the setup part of Prisma. Make sure you know how to set up Prisma with your database to follow this guide.
## Setting up the Astro Project
To set up an Astro project go to any folder you like and open the cmd in it. Type `npm create astro@latest` at follow the instructions. Then go ahead and set up Astro with SSR by typing `npx astro add node` into the cmd (make sure you're in the path of your Astro project.
## The Prisma schema
First of all we have to create our Prisma schema. We need a "User" model with an ID, a username, a hash, a salt and a session column. We also need a "Sessions" model with a "sessionid", a "startedAt" column to store the time the session started at, an "endsAt" column to store the time the session is ending at (the time the session runs out). We also need a user column which we set the type of to our "User" model and a userID column to create a "one-to-many" relation between the User model and the Sessions model.
This is what your database schema should look like:
```
model User {
  id       Int    @id @default(autoincrement())
  username String @unique
  hash Bytes
  salt String
  session Sessions[]
}

  

model Sessions {
  sessionID String @id
  startedAt Int
  endsAt Int

  user User @relation(fields: [userID], references: [id])
  userID Int
}
```

## Setting up the registration page
Note: You can remove the classes in the following html. These are just Tailwind classes I used in my project. If you use Tailwind yourself feel free to just leave them there.
Now we should set up the registration site of our Astro project. After creating the Astro Project you should already have an `index.astro` file in your pages folder. Now create a `login.astro` file with a simple login form like this:
```
<body>
  <div class="flex h-screen items-center justify-center">
    <div class="">
      <form method="POST" id="form">
        <div class=""></div>
        <input
          class="rounded-lg bg-violet-50 placeholder:text-violet-200"
          type="text"
          name="username"
          id="username"
          placeholder="Username"
          required
        />
        <div class="">
          <input
            class="rounded-lg bg-violet-50 placeholder:text-violet-200"
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            required
          />
        </div>
        <input class="w-full rounded-lg border-2 border-solid border-purple-400 bg-violet-50 font-bold text-violet-700"
          type="submit"
          value="Login"
        />
      </form>
    </div>
  </div>
</body>
```
Now also create a `register.astro`:
```
<body>
  <div class="flex h-screen items-center justify-center">
    <div class="">
      <form method="POST">
        <div class=""></div>
        <input
          class="rounded-lg bg-violet-50 placeholder:text-violet-200"
          type="text"
          name="username"
          id="username"
          placeholder="Username"
          required

        />

  

        <div class="">
          <input
            class="rounded-lg bg-violet-50 placeholder:text-violet-200"
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            required
          />
        </div>
        <input class="w-full rounded-lg border-2 border-solid border-purple-400 bg-violet-50 font-bold text-violet-700"
          type="submit"
          value="Login"
        />
      </form>
    </div>
  </div>
</body>
```

After setting up the pages we now have to set up our API endpoint.
For that create an `API` directory in your `/pages` folder and create a file named `register.js`. First import the PrismaClient aswell as "crypto" from "crypto" and "promisify" from "util" like this:
```
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import crypto from 'crypto';
import { promisify } from 'util';
```
Now create a `post` function where you check if there's an incoming JSON request and get that request like that:
```
export async function post({ request }) {
  if (request.headers.get('Content-Type') === 'application/json') {
    const body = await request.json();
  }
}
```

Now we go ahead and generate a salt and convert it to a "hex string". Then we take the password and hash it with "scrypt" (a password-based key derivation function) and our generated salt using the imported `crypto` module. After doing that we create a new User in our user database using prisma in which we store the username, the hash of the password and the salt. This is what it looks like in code:
```
const body = await request.json();
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(body.password, salt, 64, async (error, derivedKey) => {
      if (error) PromiseRejectionEvent(error);
      await prisma.user.create({
        data: {
          username: body.username,
          hash: derivedKey,
          salt: salt,
        },
      });
    });
```
Now the only thing that's left is to return a successfull response. For that make sure to import  `reponse`  in the params of the post function and return the `new Response`  at the end of the code like this:
```
    return new Response('User created', {
      status: 201,
    });
```
So that's what the code of our register endpoint should look like at the end:
```
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import crypto from 'crypto';
export async function post({ request, redirect }) {
  if (request.headers.get('Content-Type') === 'application/json') {
    const body = await request.json();
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(body.password, salt, 64, async (error, derivedKey) => {
      if (error) PromiseRejectionEvent(error)
      await prisma.user.create({
        data: {
          username: body.username,
          hash: derivedKey,
          salt: salt,
        },
      });
    });
    return new Response('User created', {
      status: 201,
    });
  }
}
```

Now to make sure our register endpoint works we have to handle the form in the `register.astro`
For that create a frontmatter in your `register.astro` and handle the form like this:
```
---
if (Astro.request.method === 'POST') {
  let response;
  try {
    const data = await Astro.request.formData();
    const username = data.get('username');
    const password = data.get('password');
    const body = { username: username, password: password };
    response = await fetch(Astro.url.origin + '/api/signUp', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
  if (response.status === 201) {
    return Astro.redirect('./login');
  }
}

---
```
The last part makes sure to redirect the user to the login page after registering.

## Setting up the login page
First we have to create a login endpoint. We do it the same as we did with the register endpoint but change the name to "login". We also import the same things but also import promisify like this: `import { promisify } from 'util'` and create a post function where we check for the JSON request with "request" as a parameter again.
So now we have to check if the username is in our database. If not we will return with the status code of `404`.
```
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import crypto from 'crypto';
import { promisify } from 'util';
export async function post({ request }) {
  if (request.headers.get('Content-Type') === 'application/json') {
    const body = await request.json();
    let row;
    try {
      row = await prisma.user.findFirstOrThrow({
        where: {
          username: body.username,
        },
      });
    } catch (error) {
      return new Response(null, { status: 404 });
    }
    }
```

Now we have to promisify `crypto.scrypt` and create a `verify` function that takes in a password, hash and salt parameter. In there we create a hex buffer from our hash (taken from the database user) and hash the password that the user used to log in with the salt from the database user. Then we compare both of them.
```
const scrypt = promisify(crypto.scrypt);
    async function verify(password, hash, salt) {
      const hashBuffer = Buffer.from(hash, 'hex');
      const derivedKey = await scrypt(password, salt, 64);
      return crypto.timingSafeEqual(hashBuffer, derivedKey);
    }
```
Now we just have to use our new function in an if statement to return a positive response with the user id if the password of the user in the database is the same as the password given in the login form and if not we return a negative response.
```
if (await verify(body.password, row.hash, row.salt)) {
      return new Response(row.id, {
        status: 200,
      });
    } else {
      console.log(`Failed to fetch user ${body.username} from the database.`);
      return new Response(null, { status: 400 });
    }
```
This is what the complete code should look like now:
```
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import crypto from 'crypto';
import { promisify } from 'util';
export async function post({ request }) {
  if (request.headers.get('Content-Type') === 'application/json') {
    const body = await request.json();
    let row;
    try {
      row = await prisma.user.findFirstOrThrow({
        where: {
          username: body.username,
        },
      });
    } catch (error) {
      return new Response(null, { status: 404 });
    }
    const scrypt = promisify(crypto.scrypt);
    async function verify(password, hash, salt) {
      const hashBuffer = Buffer.from(hash, 'hex');
      const derivedKey = await scrypt(password, salt, 64);
      return crypto.timingSafeEqual(hashBuffer, derivedKey);
    }
    if (await verify(body.password, row.hash, row.salt)) {
      return new Response(row.id, {
        status: 200,
      });
    } else {
      console.log(`Failed to fetch user ${body.username} from the database.`);
      return new Response(null, { status: 400 });
    }
  }
}
```

In the `login.astro` file we now have to handle our login form in the frontmatter like this:
```
---
if (Astro.request.method === 'POST') {
  let response;
  try {
    const data = await Astro.request.formData();
    const username = data.get('username');
    const password = data.get('password');
    const body = { username: username, password: password };
    response = await fetch(Astro.url.origin + '/api/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
  }
---
```
If the response is ok we now create a new UUID using the `randomUUID()` function of the `crypto` module. Then create a timestamp of the time and set the max age to whatever we want in seconds (in this example I'm setting it to 24h). After also getting the userID from the text of the API response we now create a session in our database and set a cookie with the session ID using `Astro.cookie`. We also return a `500` response if our `login` endpoint did not return an ok response.
```
if (response.ok) {
    try {
      const UUID = crypto.randomUUID();
      const startedAt = Math.floor(Date.now() / 1000);
      const maxAge = 60 * 60 * 24;
      const userID = parseInt(await response.text());
      await prisma.sessions.create({
        data: {
          sessionID: UUID,
          startedAt: startedAt,
          endsAt: maxAge,
          userID: userID,
        },
      });
      console.log('cookie set');
      Astro.cookies.set('sessionID', UUID, {
        httpOnly: true,
        maxAge: maxAge,
      });
      return Astro.redirect('./');
    } catch (error) {
      return new Response(null, {
        status: 500,
      });
    }
  }
```

## Checking for the cookie
Now after we set up our login and registration the only thing that's left is for us to check if the user is already logged in so that we can redirect them to the login page if they are not and let them see our protected sites if they are. We will create a function for that so we can use it on all the pages we want. First create a "util" folder in `/src`. In there we will create a `verifySession.js` file and import the Prisma client like we did before. In our function we check for the cookie and return `false` if there is no cookie. If there's a we split the cookie into a key and the sessionID stored in it since Astro returns cookies like this `key=value`. Then we check if we can find a row iwht that sessionID in our session table with Prisma and if there is one we will return `true`. Also we have to export the function so we can use it in other files. This is how the code should look like:
```
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifySession(cookie) {
  if (cookie == null) {
    return false;
  }
  const [key, sessionID] = cookie.split('=');
  try {
    const session = await prisma.sessions.findFirstOrThrow({
      where: {
        sessionID: sessionID,
      },
    });
    return true;
  } catch (error) {}
}
export default verifySession;
```


Now we have to use that function on our pages that we wan't to protect to check if the user is logged in our not. To do that first get the cookie in the frontmatter like that: `const cookie = Astro.request.headers.get('cookie');` and import our function that we just created like this: `import verifySession from '../util/verifySession';`. Now to check just put the function into an if statement and redirect the user:
```
if (await verifySession(cookie)) {
  return Astro.redirect('/');
} else {
  return Astro.redirect('/login')
}
```