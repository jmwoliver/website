---
title: "Amp is so good and so bad"
description: "The highs and lows of using Amp and its remote-first approach to software development."
date: 2026-08-15
tags: [Software, AI]
draft: false
---

I’ve been using [Amp](https://ampcode.com) full-time for personal projects the last few weeks and it has had so many ups and downs. I bought the $200/month plan and logged in to my ChatGPT subscription for the fullest experience.

It started high. I had a big research idea I’ve wanted to work on, so I opened an orb in a new project and let it rip. I went to bed and woke up the next morning to a finished prototype that was a level of quality significantly higher than what I’ve experienced from Claude or Codex. It shows it isn’t just the frontier model, but the harness and how it uses those models. Once I saw this first glimpse, I smirked and knew it was orbin’ time. The polish I immediately appreciated:

- There is a level of polish and attention to detail that feels great. The little microinteractions and designs make Amp much more fun to use.
- It doesn’t seem to have a concept of context. Whatever they do internally for compaction and managing the context feels great and never feels like “yep, quality is dropping because context is too long.”
- Sending work to an Orb is beautiful. Other harnesses have concepts of cloud environments, but the Orb is central to Amp and everything is built around that. There are parts I dislike about this that I’ll mention later, but overall it is a pretty magical feeling. I’ve written in the past about how I feel like [worktrees are not the end game](/blog/worktrees-cant-be-the-way-right/). Orbs are one attempt at fixing this.
- I love Puck. I love the silliness that has felt lost in software. Software can be fun to use and make, bring that back! Beyond that, being able to ask Puck about threads and do things at a meta level also feels like a glimpse of the future.
- I started to love the Ship button. Clearing the threads is genius too, I get this sense of “inbox zero” when I am working on a few things concurrently throughout the day and then I ship all of them and there are no threads on the left. It makes Claude/Codex feel so much more cluttered. I don’t need hundreds of past threads available.

As I started to use Amp more though, the cracks started to show. As I’ve been using it, there are little things you expect it to be able to do that it can’t or does in a new way. I’m happy to learn new ways of doing things, but sometimes they feel needlessly new just to do something different. Some of the things I’ve noted while using it:

- I hate how you set up a project. I want to be able to pick a local directory and start working immediately. I don’t like the process of creating a new project or being forced to point to an existing repo. Sometimes I just want to play around with an idea locally and being forced to make a project feels heavy mentally for some reason. Toying with a new idea that isn’t in git doesn’t feel intuitive.
- Relatedly, Orbs feel backwards. I want my projects as local directories that I can iterate on locally. Then when I want, I can send it to an Orb and stop thinking about it. That handoff process doesn’t seem to exist. I think this is intentional in the design of Amp though. Local directories wouldn’t work with how they let you use Amp on the website.
- Speaking of the website, I wanted a native Mac app the whole time. I did the thing where it lets you make the PWA into an “app” on my dock, but it never felt native.
- I think I noticed for new projects on Amp, they have their own git repo hosting? That felt weird and was always cumbersome to get it transferred over to GitHub.
- Using `amp sync` was annoying. Often I just wanted my changes pulled locally, but `amp sync` doesn’t do that (or it can but I never figured it out).
- I had issues using Ship at first. I thought Orbs were just busted, but it turned out I didn’t grant the right permissions in GitHub. The errors were not useful and Amp could not figure out what it was. This is another example of just wanting things local instead of the overhead of debugging remote environments.
- The terminal has some latency. It’s not a lot, but it was enough delay that it always felt like a remote environment.
- Amp also only has one terminal? I think it is supposed to support `tmux` but I could never get that to work. That was an annoying limitation.
- Because it is a remote environment, I don’t have my usual config and aliases. That matters less and less as agents do everything, but I still noticed it.
- I tried to make an iOS app, but the Orbs are Linux. It still attempted to make it, but it couldn’t verify anything. If it was local on my Mac, it would have been able to do it better.

Even with all of those negatives, I keep using it. As I kept hitting issues, I kept thinking I would switch back to using Codex. But each time, I kept missing Amp and would come back. There is almost a “letting go” process when using Amp - let go of the old ways of building software and conform to Amp. I don’t think this is bad, but it isn’t what I wanted to do for every project. I’m not sure I philosophically agree with Amp’s direction either. Thorsten Ball talks about building for a future of “token abundance.” I agree with this sentiment, but I don’t agree that we should be building the future exclusively for remote environments. The ideal future to me is having frontier models run locally on my Mac while I am on a plane with no internet connection. That feels way more freeing than needing WiFi to work in Amp. With the pace that open-weight frontier and local models have been progressing, along with token-optimized hardware, this future feels possible. Orbs should be one option, but they shouldn’t be the only one.

My takeaway is that Amp is so singularly focused on building for the frontier, they don’t really accommodate what needs to exist today. If you can let go and submit to Amp, the experience can be transcendent. Then you hit a simple thing you’d expect from any harness or IDE, and you fall back down to Earth. I’m not sure I’m fully convinced it is orbin’ time, but I keep using it so who knows?
