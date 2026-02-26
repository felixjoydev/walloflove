import Link from "next/link";
import Image from "next/image";
import { Gochi_Hand } from "next/font/google";

const gochiHand = Gochi_Hand({ weight: "400", subsets: ["latin"] });
import { AnimatedGradientText } from "@/components/animated-gradient-text";
import { CreativeGuestbookButton } from "@/components/creative-guestbook-button";
import { Marker } from "@/components/marker";
import { InlineAnalytics } from "@/components/inline-analytics";
import { InlineFollowers } from "@/components/inline-followers";
import { InlinePokeball } from "@/components/inline-pokeball";
import { InlineStarField, InlineVinyl } from "@/components/nostalgia-icons";
import { InlineGrowUp } from "@/components/inline-grow-up";
import { CyclingCtaButtons } from "@/components/cycling-cta-buttons";
import { ShameAnnotation } from "@/components/shame-annotation";
import { InlineFingerprint } from "@/components/inline-fingerprint";
import { InlinePencil } from "@/components/inline-pencil";
import { InlineFlower } from "@/components/inline-flower";
import { InlineNotebook } from "@/components/inline-notebook";
import { InlineStickyNote } from "@/components/inline-sticky-note";
import { SketchyStrike } from "@/components/sketchy-strike";

export function HomepageContent({ copyId = "a" }: { copyId?: string }) {
  return (
    <div
      className="min-h-screen bg-bg-page"
      aria-hidden={copyId !== "a" ? true : undefined}
      inert={copyId !== "a" ? true : undefined}
    >
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-[720px] mx-auto w-full">
        <Link href="/" className="flex items-center gap-2" tabIndex={copyId !== "a" ? -1 : undefined}>
          <Image src="/logo.svg" alt="Guestbook" width={28} height={22} />
          <span className="font-display font-semibold text-body text-text-primary">
            Guestbook
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-text-primary text-body-sm font-medium hover:opacity-70 transition-opacity"
                     >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-input bg-accent px-4 py-2 text-body-sm font-medium text-white hover:bg-accent-hover transition-colors"
                     >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-8 text-center">
        <h1 className="font-display font-bold text-[80px] leading-[0.95] tracking-tight text-text-primary">
          Make Internet
          <br />
          <AnimatedGradientText>Fun</AnimatedGradientText>{" "}
          Again
        </h1>
        <p className="mt-6 text-text-secondary text-[18px] leading-relaxed max-w-[420px] mx-auto">
          A place for your visitors to express their love
        </p>
        <div className="mt-8 relative inline-block">
          <CreativeGuestbookButton />
          {/* "Play around" annotation */}
          <span className="absolute -right-32 top-0 text-text-secondary text-[14px] italic rotate-[-6deg]">
            Play around
            <svg
              className="absolute -left-4 bottom-[-12px] rotate-[160deg]"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M7 7C7 7 12 8 15 12C18 16 17 20 17 20" />
              <path d="M14 18L17 21L20 18" />
            </svg>
          </span>
        </div>
      </section>

      {/* Interactive Demo — Wall of Love frame on full-width gradient */}
      <section
        className="pt-4 pb-16"
        style={{
          background:
            "linear-gradient(90deg, #FF5159 0%, #D048FF 20.22%, #6C73FF 40.44%, #407CFF 60.11%, #54FF9C 79.78%, #C1EA68 100%)",
        }}
      >
        <div className="max-w-[900px] mx-auto px-6">
          <div className="rounded-card shadow-card overflow-hidden border border-border bg-bg-card">
            {/* Mock Wall of Love page */}
            <div className="p-8">
              {/* Wall header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={24}
                    height={19}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-icon bg-bg-subtle" tabIndex={copyId !== "a" ? -1 : undefined}>
                    <Image
                      src="/grid.svg"
                      alt="Grid"
                      width={16}
                      height={16}
                    />
                  </button>
                  <button className="p-1.5 rounded-icon" tabIndex={copyId !== "a" ? -1 : undefined}>
                    <Image
                      src="/table-rows.svg"
                      alt="List"
                      width={16}
                      height={16}
                    />
                  </button>
                </div>
              </div>

              {/* Wall title */}
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-[28px] text-text-primary">
                  Wall of Love
                </h2>
                <p className="text-text-secondary text-body-sm mt-1">
                  A place for your visitors to express their love
                </p>
              </div>

              {/* Sticky notes grid */}
              <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto mb-8">
                {[
                  "bg-[#FFF9C4]",
                  "bg-[#FFF9C4]",
                  "bg-[#FFF9C4]",
                  "bg-[#FFF9C4]",
                ].map((color, i) => (
                  <div
                    key={i}
                    className={`${color} rounded-sm aspect-square shadow-card-sm`}
                  />
                ))}
              </div>

              {/* Sign the Guestbook button */}
              <div className="text-center">
                <span className="inline-block rounded-input bg-text-primary px-6 py-3 text-body-sm font-medium text-white">
                  Sign the Guestbook
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative */}
      <section className="max-w-[500px] mx-auto px-6 py-16">
        <div className="space-y-16 font-display text-[28px] leading-relaxed text-text-primary">
          {/* Block 1: Nostalgia */}
          <div className="space-y-6">
            <p>Remember guestbooks?</p>
            <div>
              <p>
                You&apos;d visit someone&apos;s personal website, maybe it had a{" "}
                <InlineStarField /> star-filled background, maybe a{" "}
                <InlineVinyl /> MIDI track was playing, and at the
                bottom, there it was.{" "}
                <Marker variant="highlight">Sign my guestbook.</Marker>
              </p>
              <div className="mt-2 inline-flex items-center justify-center bg-accent border border-[#2E2072] border-b-[3px] p-1.5">
                <div className="flex items-center justify-center border border-dashed border-[#2E2072] px-5 py-0.5">
                  <span className="text-[13px] font-medium text-[#2E2072]">
                    Sign my Guestbook
                  </span>
                </div>
              </div>
            </div>
            <p>
              You&apos;d type your{" "}
                <span
                  className="inline-block w-[2px] h-[1.1em] bg-[#2684FF] align-middle"
                  style={{ animation: "cursor-blink 1s step-end infinite" }}
                />name, leave a little <span style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}>note</span>, maybe compliment
              their <InlinePokeball /> Pokémon fan art collection. Then you&apos;d move on. But
              something stayed.
            </p>
            <p>
              A small act of connection. A human{" "}
              <Marker variant="highlight">I was here</Marker> in a
              digital space. <InlineFollowers /> No followers. <InlineAnalytics /> No analytics. No conversion funnel.
              Just fun.
            </p>
          </div>

          {/* Block 2: The shift */}
          <div className="space-y-6">
            <p>Then the internet grew <InlineGrowUp /></p>
            <p>
              Websites became landing pages. Landing pages became funnels. Every
              pixel optimized. Every click tracked. Every interaction designed to
              <Marker variant="highlight-red">extract something from you.</Marker>
            </p>
            <div>
              <p>
                <Marker variant="highlight">Book a demo. Start your free trial. Schedule a call.</Marker>
              </p>
              <div className="mt-2">
                <CyclingCtaButtons />
              </div>
            </div>
            <p>
              The personal web, the weird, creative, messy web, got paved over
              by templates and conversion-rate optimization. Somewhere along the
              way, we stopped building websites that felt like{" "}
              <Marker variant="underline">places.</Marker>{" "}
              They became machines.
            </p>
          </div>

          {/* Block 3: The reframe */}
          <div className="space-y-6">
            <p>We think that&apos;s a <ShameAnnotation /></p>
            <p>
              Because the best part of the internet was never the efficiency. It
              was the personality. The human <InlineFingerprint /> fingerprint. The feeling that a real
              person made this, and they wanted you to enjoy it.
            </p>
            <p>What if your website could feel like that again?</p>
          </div>

          {/* Block 4: The product */}
          <div className="space-y-6">
            <p>That&apos;s why we built <Image src="/logo.svg" alt="SignBoard" width={36} height={28} className="inline-block align-middle" /> SignBoard.</p>
            <p>
              Visitors pick up a <InlinePencil /> pen, <InlineFlower /> draw something silly, sign their name,
              leave a note. Each entry shows up as a unique <span className={gochiHand.className}>hand-drawn</span> card on a
              wall that&apos;s <Marker variant="highlight">unmistakably alive.</Marker>
            </p>
            <p>
              Your wall lives on <Marker variant="highlight">its own page</Marker>, with <Marker variant="highlight">your branding</Marker>, on <Marker variant="highlight">your
              domain</Marker>. Or <Marker variant="highlight">embed it</Marker> anywhere with a few lines of code.{" "}
              <InlineNotebook /> Notebook
              style or colorful <InlineStickyNote /> sticky notes. However you want it.
            </p>
          </div>

          {/* Block 5: The close */}
          <div className="space-y-6">
            <p>
              The internet doesn&apos;t need another <SketchyStrike>form</SketchyStrike>. Another <SketchyStrike>chatbot</SketchyStrike>.
              Another <SketchyStrike>notification</SketchyStrike> asking you to subscribe.
            </p>
            <p>
              It needs a little more personality. A little more play. A little
              more <Marker variant="underline">I was here.</Marker>
            </p>
            <p>
              We&apos;re starting with guestbooks. Because guestbooks were
              always about one simple idea:
            </p>
            <p><Marker variant="highlight">You visited. You left a mark. You mattered.</Marker></p>
          </div>
          <div className="-mt-4 font-sans [&_a]:block [&_a>div]:w-full">
            <CreativeGuestbookButton />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-24 pt-4 text-center">
        <div className="inline-flex items-center gap-3 text-text-secondary text-[15px]">
          <span>Made by</span>
          <a
            href="https://houseofbrands.cv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
            tabIndex={copyId !== "a" ? -1 : undefined}
          >
            <Image src="/house-of-brands.svg" alt="House of Brands" width={28} height={28} />
            <span className="font-medium text-text-primary">House of Brands</span>
          </a>
          <span className="text-border">|</span>
          <a
            href="https://x.com/felixjoydc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
            tabIndex={copyId !== "a" ? -1 : undefined}
          >
            <Image src="/felix.webp" alt="Felix Joy" width={28} height={28} className="rounded-full" />
            <span className="font-medium text-text-primary">@felixjoydc</span>
          </a>
        </div>
        <div className="flex items-center justify-between max-w-[720px] mx-auto mt-16 px-6 text-[12px] text-text-secondary">
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:opacity-70 transition-opacity" tabIndex={copyId !== "a" ? -1 : undefined}>Terms &amp; Conditions</Link>
            <Link href="/privacy" className="hover:opacity-70 transition-opacity" tabIndex={copyId !== "a" ? -1 : undefined}>Privacy Policy</Link>
            <Link href="/help" className="hover:opacity-70 transition-opacity" tabIndex={copyId !== "a" ? -1 : undefined}>Help</Link>
          </div>
          <span>&copy;2026</span>
        </div>
      </footer>
    </div>
  );
}
