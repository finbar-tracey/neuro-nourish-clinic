import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_TODAY_FUTURE } from "@/lib/neuronourish-copy";

export function TodayFutureSection({ className = "" }: { className?: string }) {
  return (
    <PageSection className={`nn-why-section py-14 sm:py-20 ${className}`}>
      <PageContainer width="xl">
        <SectionHeader
          eyebrow={NN_TODAY_FUTURE.eyebrow}
          headline={NN_TODAY_FUTURE.headline}
          subtext={NN_TODAY_FUTURE.subtext}
          align="center"
          headlineClassName="max-w-3xl"
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-8">
          <div>
            <h3 className="nn-display-card text-center text-deep-slate lg:text-left">
              {NN_TODAY_FUTURE.today.title}
            </h3>
            <NnCardGrid columns={2} className="mt-5">
              {NN_TODAY_FUTURE.today.items.map((item) => (
                <NnCard key={item.title} title={item.title} body={<p>{item.body}</p>} />
              ))}
            </NnCardGrid>
          </div>
          <div>
            <h3 className="nn-display-card text-center text-deep-slate lg:text-left">
              {NN_TODAY_FUTURE.future.title}
            </h3>
            <NnCardGrid columns={2} className="mt-5">
              {NN_TODAY_FUTURE.future.items.map((item) => (
                <NnCard key={item.title} title={item.title} body={<p>{item.body}</p>} />
              ))}
            </NnCardGrid>
          </div>
        </div>
      </PageContainer>
    </PageSection>
  );
}
