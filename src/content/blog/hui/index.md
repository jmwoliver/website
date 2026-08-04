---
title: "hui: A visual alternative to history written in Rust"
description: "A Rust terminal UI for searching and copying commands from shell history."
date: 2023-05-18
tags: [Rust]
draft: false
---

`hui` is a command-line tool to visualize and search your shell history. The source code is available on [GitHub](https://github.com/jmwoliver/hui).

<figure><img src="/hui_demo.gif" alt="Quickly searching through history with hui" loading="lazy"><figcaption>Quickly searching through history with hui</figcaption></figure>

## Overview

`hui` is command-line tool to quickly search through your terminal history. The motivation behind this tool was having a prettier and faster way to do `history | grep <search>`. I would do this frequently to remember some `docker` or `curl`
command I had done recently, but couldn't remember the flags I used. This now lets me search through my history and copy the command I want a lot easier.

`hui` is built on top of [ratatui](https://github.com/tui-rs-revival/ratatui) for its TUI, or Terminal User Interface.
