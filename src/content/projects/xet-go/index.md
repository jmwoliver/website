---
title: "xet-go"
description: "A native, CGO-free Go implementation of the Xet v1.1 data plane."
date: 2026-08-04
tags: [Go, Storage, Libraries]
repoURL: "https://github.com/jmwoliver/xet-go"
draft: false
---

`xet-go` produces and consumes Xet hashes, chunks, xorbs, metadata shards, CAS requests, reconstruction recipes, and sparse delta uploads without invoking Rust.

The hosting-independent library provides streaming transfers, concurrency controls, persistent caching, and protocol compatibility with the official Xet implementation.
