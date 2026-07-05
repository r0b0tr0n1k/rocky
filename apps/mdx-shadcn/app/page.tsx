import { List } from "@/components/posts/list.js";
import { Hero } from "@/components/site/hero.js";
import { Main } from "@rocky/ui/components/ds";

import { getAllPosts } from "@/lib/posts.js";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <Main>
      <Hero />
      <List posts={posts} />
    </Main>
  );
}
