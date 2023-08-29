import { z, defineCollection } from "astro:content";

const blogCollection = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        publishedDate: z.date(),
        description: z.string(),
        tags: z.array(z.string())
    })
})

export const collections = {
    "blog": blogCollection
 };
