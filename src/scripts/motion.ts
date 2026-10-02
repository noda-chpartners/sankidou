import "lenis/dist/lenis.css";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type MotionHandle = { destroy: () => void };

const host = window as Window & { __sankido?: MotionHandle };
host.__sankido?.destroy();

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const lenis = new Lenis({
	anchors: true,
	lerp: reduced ? 1 : 0.085,
	autoRaf: false,
	stopInertiaOnNavigate: true,
	wheelMultiplier: 0.92,
});

lenis.on("scroll", ScrollTrigger.update);

const onTick = (time: number) => {
	lenis.raf(time * 1000);
};

gsap.ticker.add(onTick);
gsap.ticker.lagSmoothing(0);

const header = document.querySelector<HTMLElement>("[data-header]");
const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
const nav = document.querySelector<HTMLElement>("#site-nav");
const navLabel = toggle?.querySelector<HTMLElement>(".sr-only");
const ac = new AbortController();
const { signal } = ac;

const setMenu = (open: boolean) => {
	header?.classList.toggle("is-open", open);
	toggle?.setAttribute("aria-expanded", String(open));
	if (navLabel) navLabel.textContent = open ? "メニューを閉じる" : "メニュー";
	document.body.classList.toggle("is-locked", open);
	if (open) lenis.stop();
	else lenis.start();
};

toggle?.addEventListener("click", () => {
	setMenu(!header?.classList.contains("is-open"));
}, { signal });

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") setMenu(false);
}, { signal });

nav?.querySelectorAll("a").forEach((link) => {
	link.addEventListener("click", () => setMenu(false), { signal });
});

const headerST = ScrollTrigger.create({
	start: 12,
	end: 99999,
	onToggle: (self) => header?.classList.toggle("is-scrolled", self.isActive),
});

const spies = [...document.querySelectorAll<HTMLAnchorElement>(".nav a[href^='#']")]
	.map((link) => {
		const id = link.getAttribute("href");
		if (!id || id === "#top") return null;
		const section = document.querySelector(id);
		if (!section) return null;
		return ScrollTrigger.create({
			trigger: section,
			start: "top 45%",
			end: "bottom 45%",
			onToggle: (self) => link.classList.toggle("is-current", self.isActive),
		});
	})
	.filter((item): item is ScrollTrigger => item !== null);

const mm = gsap.matchMedia();

mm.add(
	{
		motion: "(prefers-reduced-motion: no-preference)",
		desktop: "(min-width: 960px)",
	},
	(context) => {
		const { motion, desktop } = context.conditions ?? {};
		if (!motion) return;

		gsap.fromTo(".door__photo img", { scale: 1.06 }, {
			scale: 1,
			duration: 1.8,
			ease: "power2.out",
		});
		gsap.fromTo(".door__plate", { y: 28, autoAlpha: 0 }, {
			y: 0,
			autoAlpha: 1,
			duration: 0.9,
			delay: 0.15,
			ease: "power3.out",
		});

		gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
			gsap.fromTo(el, { y: 28, autoAlpha: 0 }, {
				y: 0,
				autoAlpha: 1,
				duration: 0.9,
				ease: "power3.out",
				scrollTrigger: {
					trigger: el,
					start: "top 88%",
					once: true,
				},
			});
		});

		gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]").forEach((group) => {
			const items = group.children;
			if (!items.length) return;
			gsap.fromTo(items, { y: 22, autoAlpha: 0 }, {
				y: 0,
				autoAlpha: 1,
				duration: 0.75,
				stagger: 0.07,
				ease: "power3.out",
				scrollTrigger: {
					trigger: group,
					start: "top 84%",
					once: true,
				},
			});
		});

		if (!desktop) return;

		const track = document.querySelector<HTMLElement>("[data-track]");
		const pin = document.querySelector<HTMLElement>("[data-pin]");
		if (!track || !pin) return;

		gsap.to(track, {
			x: () => -(track.scrollWidth - window.innerWidth + 48),
			ease: "none",
			scrollTrigger: {
				trigger: pin,
				start: "top top",
				end: () => `+=${Math.max(track.scrollWidth - window.innerWidth, 0)}`,
				pin: true,
				scrub: 0.7,
				invalidateOnRefresh: true,
			},
		});
	},
);

window.addEventListener("load", () => ScrollTrigger.refresh(), { signal });

host.__sankido = {
	destroy() {
		ac.abort();
		setMenu(false);
		mm.revert();
		headerST.kill();
		spies.forEach((trigger) => trigger.kill());
		gsap.ticker.remove(onTick);
		lenis.destroy();
		host.__sankido = undefined;
	},
};
