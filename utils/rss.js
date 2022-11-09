import fs from "fs";
import RSS from "rss";
import { getSortedPosts } from "@utils/posts";

export async function generateRssFeed() {
  const site_url = "https://www.cloudgardener.dev";

  const allPosts = await getSortedPosts();

  const feedOptions = {
    title: "Cloud Gardener | RSS Feed",
    description: "The next generation of the Cloud Gardener blog.",
    site_url: site_url,
    feed_url: `${site_url}/rss.xml`,
    image_url: `${site_url}/favicon.ico`,
    pubDate: new Date(),
    copyright: `© ${new Date().getFullYear()} Niko Virtala`,
  };

  const feed = new RSS(feedOptions);

  allPosts.map((post) => {
    feed.item({
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      url: `${site_url}/${post.slug}`,
      date: post.frontmatter.date,
    });
  });

  fs.writeFileSync("./public/rss.xml", feed.xml({ indent: true }));
}
