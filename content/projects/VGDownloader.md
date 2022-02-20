---
title: "VGDownloader: Download Video Game Music"
date: Sun Jun 20 09:07:25 EST 2021
tags: [Go, Video Games]
---

[VGDownloader](https://github.com/jmwoliver/VGDownloader/) is a lightweight CLI that lets you download any<sup>* </sup> video game soundtrack. Written in Go and built on [PromptUI](https://github.com/manifoldco/promptui), it pings [downloads.khinsider.com](https://downloads.khinsider.com/) to retrieve the album for download. It uses channels and work groups to concurrently get the download links for every song in the album, downloading them all at the same time. This significantly reduces the amount of time to download the album vs. sequentially downloading from the website.

{{< figure src="/vgdownloader.gif" title="VGDownloader in Action" >}}

_<sup>*</sup>The selection is dependent on it being among the 8TB+ of music available on [downloads.khinsider.com](https://downloads.khinsider.com/). Notable omissions include Square Enix soundtracks because the authors asked it to be removed. You can find a complete blacklist [here](https://downloads.khinsider.com/blacklist)._

# Overview

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

# Concurrent Downloads

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

## Channels

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

## Sync Groups

Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

```go
func getCookie(name string, r interface{}) (*http.Cookie, error) {
	rd := r.(*http.Request)
	cookie, err := rd.Cookie(name)
	if err != nil {
		return nil, err
	}
	return cookie, nil
}

func setCookie(cookie *http.Cookie, w interface{}) error {
	// Get write interface registered using `Acquire` method in handlers.
	wr := w.(http.ResponseWriter)
	http.SetCookie(wr, cookie)
	return nil
}
```

# Performance Comparisons
Lid est laborum et dolorum fuga. Et harum quidem rerum facilis est et expeditasi distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihilse impedit quo minus id quod amets untra dolor amet sad. Sed ut perspser iciatis unde omnis iste natus error sit voluptatem accusantium doloremque laste. Dolores sadips ipsums sits.

# Current Limitations

## Song Naming
My biggest annoyance making this was that you can only get the metadata of the song after it has finished downloading. When I originally made this, I would name the songs `1.mp3`, `2.mp3`, ..., then reopen the file to rename it with the provided metadata. When doing this concurrently, it was causing collisions that made it explode.

I ended up using a worse alternative of getting the name found within the URL. The problem is it's not always correct / formatted properly, but gave the simplest solution that was more resilient to breakages.

Another option would be to get the name by scraping the page, but the site doesn't use consistent ID or class tags in the HTML for the song name (or anything), so it would be difficult to quickly get the name of the song when getting the download link.

## No External API
A broader issue is that there is no API so I have to scrape everything. An API would make this much easier and would probably help provide more functionality than what I have. But I'm currently being a vagrant, stealing bandwidth for free from the site, so beggars can't be choosers I guess.

TODO:
- [X] Figure out how to put gif in this .md
- [] Give an overview
- [] Show some concurrent code
- [] Maybe make a graph of downloading sequentially vs. concurrently
- [X] Current limitations / issues