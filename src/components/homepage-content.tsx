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
import { HomepageDemo } from "@/components/homepage-demo";

export function HomepageContent({ copyId = "a" }: { copyId?: string }) {
  return (
    <div
      className="min-h-screen bg-bg-page"
      aria-hidden={copyId !== "a" ? true : undefined}
      inert={copyId !== "a" ? true : undefined}
    >
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-[720px] mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5" tabIndex={copyId !== "a" ? -1 : undefined}>
          <Image src="/logo.svg" alt="Guestbook" width={40} height={30} />
          <span className="font-display font-semibold text-[20px] text-text-primary">
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
      <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-16 text-center">
        <h1 className="font-display font-bold text-[80px] leading-[0.95] tracking-tight text-text-primary">
          Make Internet
          <br />
          <AnimatedGradientText>Fun</AnimatedGradientText>{" "}
          Again
        </h1>
        <p className="mt-6 text-text-secondary text-[18px] leading-relaxed max-w-[420px] mx-auto">
          A hand-drawn guestbook for your website. Visitors draw, sign, doodle — each mark lands on a wall that feels unmistakably alive.
        </p>
        <div className="mt-8">
          <CreativeGuestbookButton />
        </div>
      </section>

      {/* "Play around" annotation with arrow pointing to demo */}
      <div className="flex flex-col items-center -mb-4 ml-[200px]">
        <span className={`text-text-secondary text-[16px] ${gochiHand.className} ml-[70px]`}>
          Play around
        </span>
        <Image src="/arrow-home.svg" alt="" width={90} height={93} className="mt-1" />
      </div>

      {/* Interactive Demo — Wall of Love on full-width gradient */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.26,
            background:
              "linear-gradient(90deg, #FF5159 0%, #D048FF 20.22%, #6C73FF 40.44%, #407CFF 60.11%, #54FF9C 79.78%, #FFE23C 100%)",
            filter: "blur(4px)",
          }}
        />
        <div className="relative max-w-[1100px] mx-auto px-6">
          <HomepageDemo />
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
            <p>That&apos;s why we built <Image src="/logo.svg" alt="Guestbook" width={36} height={28} className="inline-block align-middle" /> Guestbook.</p>
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
