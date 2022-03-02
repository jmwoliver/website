---
title: "LZW Implementation in Go"
date: Sun Apr 18 09:07:25 EST 2021
tags: [Go, Algorithm]
draft: true
---

[lzw-go](https://github.com/jmwoliver/lzw-go) is an implementation of the LZW compression algorithm written in Go. It can compress a `.txt` file into a `.lzw` file, as well as decompress `.lzw` files back into their original `.txt`.

Note: this is a small version meant to learn how LZW worked. It doesn't work for long text files because when the dictionary exceeds 256, it can't convert the bytes (2^8 = 256) properly. Full implementations account for this and provide more bits after the overflow.

{{< figure src="/vgdownloader.gif" title="VGDownloader in Action" >}}

# What is LZW?

- [] say who made it
- [] say it's common
- [] say it is used in unix's `compress` command

# How Does it Work?

- [] Give some background about how it works (removing repitition)
- [] Lossless vs. lossy
- [] show code

## See it in Action

I'm able to use the interactive CLI by typing in the title of the game I want. To make a prompt with PromptUI, all it takes here is:


# Limitations and Next Steps

