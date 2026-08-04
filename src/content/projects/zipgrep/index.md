---
title: "zipgrep"
description: "A high-performance, parallel grep implementation written in Zig."
date: 2025-12-30
tags: [Zig, CLI, Search]
repoURL: "https://github.com/jmwoliver/zipgrep"
draft: false
---

`zipgrep` recursively searches files using literal and regular-expression patterns while respecting `.gitignore` rules. It includes colorized output, glob filtering, binary-file detection, and parallel searching.

The implementation uses SIMD-accelerated matching and memory-mapped I/O to keep searches fast while producing a small binary.
