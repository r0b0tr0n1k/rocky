// biome-ignore assist/source/organizeImports: biome
import { MDXContent } from "@/components/markdown/mdx-content";
import { Meta } from "@/components/markdown/meta";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { Container, Main, Prose, Section } from "@rocky/ui/components/ds";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Post } from "../../.velite";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post: Post) => ({
    slug: post.slug.split("/"),
  }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug.join("/");
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const slug = params.slug.join("/");
  const post = getPostBySlug(slug);

  if (!post?.published) {
    notFound();
  }

  return (
    <Main>
      <Meta
        title={post.title}
        description={post.description}
        date={post.date}
        author={post.author}
        tags={post.tags}
        slug={post.slug}
      />
      <Section>
        <Container>
          <Prose isArticle isSpaced>
            <MDXContent code={post.body} />
          </Prose>
        </Container>
      </Section>
    </Main>
  );
}
