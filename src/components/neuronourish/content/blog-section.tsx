import { GoldButton } from "@/components/neuronourish/shell";
import { BlogGrid } from "@/components/neuronourish/content/blog-grid";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_BLOG } from "@/lib/neuronourish-copy";

export function BlogSection({ className = "" }: { className?: string }) {
  return (
    <PageSection id="blog" className={`nn-blog-section border-t border-linen/80 ${className}`}>
      <PageContainer width="xl">
        <SectionHeader
          eyebrow={NN_BLOG.eyebrow}
          headline={NN_BLOG.headline}
          subtext={NN_BLOG.subtext}
          headlineClassName="max-w-3xl"
        />
        <BlogGrid posts={NN_BLOG.posts} />
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-mist/80 pt-10">
          <GoldButton href="/quiz">{NN_BLOG.cta}</GoldButton>
          <span className="text-xs text-ink/60">{NN_BLOG.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
