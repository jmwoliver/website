---
title: "VGDownloader"
description: "A concurrent Go CLI for downloading video game soundtracks."
date: 2021-06-20
tags: [Go, CLI, Video Games]
repoURL: "https://github.com/jmwoliver/VGDownloader"
writeupURL: "/blog/vgdownloader/"
draft: false
---

VGDownloader searches for video game soundtracks and downloads their songs concurrently. It uses Go channels and wait groups to reduce the time required for larger albums.

The full write-up describes the command-line interface, concurrent download pipeline, and performance comparisons.
