---
title: "Apple ruins my personal software dream"
description: "Apple’s seven-day provisioning limit gets in the way of software made for one."
date: 2026-08-19
tags: [Software, AI, Apple]
draft: false
---

I am sold on the idea that writing software for just yourself is the future. This idea has been popularized in various blogs like [Personal Software](https://leerob.com/personal-software) and [Software for One](https://www.ajwaxman.com/writing/software-for-one). I recently did this myself when building my own workout app. I was trying to mix yoga, running, and weight lifting with different progressions. I looked at a few different apps and none of them were really what I wanted. I could have downloaded a few and tracked everything in different places, but instead I tossed a prompt at Codex and let it rip. In basically one shot, it made a fully functional Swift app that was _exactly_ what I wanted. It is such a freeing feeling to have an app made perfectly for you.

<figure style="max-width: 365px; margin-inline: auto;"><img src="/minimalift-today.png" alt="The Today screen of the Minimalift workout app" width="1206" height="2622" loading="lazy"><figcaption>Minimalift, my personal workout app</figcaption></figure>

However, Apple is the problem. First, you have to own a Mac to even do native iOS development with Xcode. That is already a fairly high barrier to entry. Then you have to do a bunch of rigmarole to set up local code signing to get a local build pushed to your own iPhone. And then, **even if you get over those barriers**, local builds signed with a free Apple Account [expire after seven days](https://developer.apple.com/support/compare-memberships/)! So I have to plug my phone back into my Mac and redeploy every seven days just to use software I made on hardware I own.

<figure style="max-width: 371px; margin-inline: auto;"><img src="/minimalift-unavailable.jpg" alt="An iPhone alert saying Minimalift is no longer available" width="1260" height="370" loading="lazy"><figcaption>The result when the provisioning profile expires</figcaption></figure>

My dream is to be able to have an agent on my phone that I can prompt “build me a fitness app for …” and it can write it in device-native code, build it, and run it all on-device. Then you have an app that is yours alone. This is where the future is heading.

Android does not have the same seven-day limitation, but I want this experience on my iPhone. If Apple keeps iOS this locked down, then developing for the web feels like the only way to have this future there. After hitting these annoying Apple limitations, I can actually see the AI giants like [OpenAI having successful hardware](https://openai.com/sam-and-jony/) if they do it right.
