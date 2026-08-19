---
title: "Apple ruins my personal software dream"
description: "Apple’s seven-day provisioning limit gets in the way of software made for one."
date: 2026-08-19
tags: [Software, AI, Apple]
draft: false
---

I’m sold on the idea that writing software just for yourself is the future. This idea has been popularized in essays like [Personal Software](https://leerob.com/personal-software) and [Software for One](https://www.ajwaxman.com/writing/software-for-one). I recently did this myself by building my own workout app. I was trying to combine yoga, running, and weightlifting with different progressions. I looked at a few apps, and none of them were really what I wanted. I could have downloaded several and tracked everything in different places, but instead I tossed a prompt at Codex and let it rip. In basically one shot, it made a fully functional Swift app that was _exactly_ what I wanted. It is such a freeing feeling to have an app made perfectly for you.

<figure style="max-width: 365px; margin-inline: auto;"><img src="/minimalift-today.png" alt="The Today screen of the Minimalift workout app" width="1206" height="2622" loading="lazy"><figcaption>Minimalift, my personal workout app</figcaption></figure>

However, Apple is the problem. To build a native iOS app with Apple’s official tools, you need Xcode—and Xcode requires a Mac. That is already a fairly high barrier to entry. Then there is all the rigmarole of enabling Developer Mode, configuring code signing, and installing a local build on your iPhone. Even if you get over those barriers, a free [Xcode Personal Team](https://developer.apple.com/support/compare-memberships/) provisioning profile expires after seven days. Apple says this may require you to rebuild and reinstall the app. You can pay $99 per year for the Apple Developer Program instead, but that is ridiculous for software only I use. So every seven days, I have to reconnect my phone to Xcode—over USB or wirelessly—and redeploy just to keep using software I made on hardware I own.

<figure style="max-width: 371px; margin-inline: auto;"><img src="/minimalift-unavailable.jpg" alt="An iPhone alert saying Minimalift is no longer available" width="1260" height="370" loading="lazy"><figcaption>The result when the provisioning profile expires</figcaption></figure>

My dream is to have an agent on my phone that I can prompt, “Build me a fitness app for …,” and have it write native code, build the app, and run it entirely on-device. Then I have an app that is mine alone. This is where the future is heading.

Android is much less restrictive here: [Android Studio runs on Windows, macOS, Linux, and ChromeOS](https://developer.android.com/studio), and its default [self-signed debug certificate lasts 30 years](https://developer.android.com/studio/publish/app-signing#debug-mode). If Apple does not support this model, the web is the clearest way to make personal software work across the hardware people already own. After hitting these annoying Apple limitations, I can actually see AI giants like [OpenAI having successful hardware](https://openai.com/sam-and-jony/) if they do it right.
