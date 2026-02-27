import { InfiniteScrollWrapper } from "@/components/infinite-scroll-wrapper";
import { HomepageContent } from "@/components/homepage-content";

export default function HomePage() {
  return (
    <main className="bg-bg-page">
      <InfiniteScrollWrapper>
        <HomepageContent copyId="a" />
        <HomepageContent copyId="b" />
      </InfiniteScrollWrapper>
    </main>
  );
}
