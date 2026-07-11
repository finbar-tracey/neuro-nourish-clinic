import Link from "next/link";
import type { BlogPost } from "@/lib/neuronourish-copy";

const THEME_CLASS: Record<BlogPost["imageTheme"], string> = {
  sleep: "nn-blog-art--sleep",
  movement: "nn-blog-art--movement",
  nutrition: "nn-blog-art--nutrition",
  energy: "nn-blog-art--energy",
  habits: "nn-blog-art--habits",
  metabolic: "nn-blog-art--metabolic",
};

const THEME_LABEL: Record<BlogPost["imageTheme"], string> = {
  sleep: "Sleep",
  movement: "Movement",
  nutrition: "Nutrition",
  energy: "Energy",
  habits: "Habits",
  metabolic: "Metabolic health",
};

function BlogThemeIcon({ theme }: { theme: BlogPost["imageTheme"] }) {
  const className = "h-12 w-12 text-ivory/90";

  switch (theme) {
    case "sleep":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 14.5A7.5 7.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "movement":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M13 5l3 3-5 5 4 4M6 19l3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "nutrition":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21c4-4 6-7.5 6-11a6 6 0 1 0-12 0c0 3.5 2 7 6 11Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 7v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "energy":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "habits":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "metabolic":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 12h2l2-6 3 12 2-8 2 4h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function BlogGrid({ posts }: { posts: readonly BlogPost[] }) {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
      {posts.map((post) => (
        <article
          key={post.slug}
          className="nn-blog-card group flex flex-col overflow-hidden rounded-2xl border border-mist bg-white/90 shadow-sm"
        >
          <Link href={`/blog#${post.slug}`} className="flex flex-1 flex-col focus-visible:outline-none">
            <div className={`nn-blog-art relative h-44 ${THEME_CLASS[post.imageTheme]}`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-35 transition-opacity duration-300 group-hover:opacity-50">
                <BlogThemeIcon theme={post.imageTheme} />
              </div>
              <span className="nn-badge absolute left-3 top-3 bg-white/92 text-deep-slate">
                {THEME_LABEL[post.imageTheme]}
              </span>
            </div>
            <div className="relative flex flex-1 flex-col p-6">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/55" aria-hidden />
              <h3 className="nn-display-card text-slate-blue transition-colors group-hover:text-deep-slate">
                {post.title}
              </h3>
              {post.excerpt ? (
                <p className="mt-2 flex-1 text-sm leading-[1.75] text-ink/70">{post.excerpt}</p>
              ) : null}
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="nn-text-link text-sm">Read article →</span>
                <span className="text-xs text-ink/50">{post.readTime}</span>
              </div>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
