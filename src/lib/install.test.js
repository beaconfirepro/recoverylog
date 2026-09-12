import { describe, expect, it } from "vitest";
import { isIos, isIosSafari, isStandalone, shouldOfferInstall } from "@/lib/install";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME = IPHONE_SAFARI.replace("Safari/604.1", "CriOS/126.0 Mobile/15E148 Safari/604.1");
const IPAD_OS = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15";
const MAC = IPAD_OS;
const ANDROID = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36";

const nav = (userAgent, extra = {}) => ({ userAgent, maxTouchPoints: 0, ...extra });
const win = (standalone) => ({ matchMedia: () => ({ matches: standalone }) });

describe("isIos", () => {
  it("knows an iPhone", () => expect(isIos(nav(IPHONE_SAFARI))).toBe(true));

  it("knows an iPad, which claims to be a Mac", () => {
    // iPadOS 13 and up reports a desktop user agent and gives itself away only
    // by having a touch screen.
    expect(isIos(nav(IPAD_OS, { maxTouchPoints: 5 }))).toBe(true);
  });

  it("does not mistake a real Mac for one", () => expect(isIos(nav(MAC))).toBe(false));
  it("is not Android", () => expect(isIos(nav(ANDROID))).toBe(false));
});

describe("isIosSafari", () => {
  it("is Safari on iOS", () => expect(isIosSafari(nav(IPHONE_SAFARI))).toBe(true));

  it("is not Chrome on iOS", () => {
    // Chrome and Firefox on iOS cannot add to the home screen at all, so the
    // Share instruction would send them hunting for a menu item that is not
    // there.
    expect(isIosSafari(nav(IPHONE_CHROME))).toBe(false);
  });
});

describe("isStandalone", () => {
  it("reads the iOS-only flag", () => expect(isStandalone(nav(IPHONE_SAFARI, { standalone: true }), win(false))).toBe(true));
  it("reads the media query everyone else answers", () => expect(isStandalone(nav(ANDROID), win(true))).toBe(true));
  it("is false in a browser tab", () => expect(isStandalone(nav(IPHONE_SAFARI), win(false))).toBe(false));
  it("copes with neither being available", () => expect(isStandalone({}, {})).toBe(false));
});

describe("shouldOfferInstall", () => {
  it("offers it to someone who could act on it", () => {
    expect(shouldOfferInstall({ nav: nav(IPHONE_SAFARI), win: win(false), dismissed: false })).toBe(true);
  });

  it("never offers it to someone who already installed it", () => {
    expect(shouldOfferInstall({ nav: nav(IPHONE_SAFARI, { standalone: true }), win: win(false) })).toBe(false);
  });

  it("never offers it twice once she has said no", () => {
    expect(shouldOfferInstall({ nav: nav(IPHONE_SAFARI), win: win(false), dismissed: true })).toBe(false);
  });

  it("never offers it where the instruction would be wrong", () => {
    expect(shouldOfferInstall({ nav: nav(IPHONE_CHROME), win: win(false) })).toBe(false);
    expect(shouldOfferInstall({ nav: nav(ANDROID), win: win(false) })).toBe(false);
  });
});
