---
title: "Optimize for the Common Case"
date: Tue Mar 8 06:12:45 EST 2022
---

I have this long-running joke/belief with a friend that many concepts within Computer Science actually translate to everyday life really well. One such example is *Optimizing for the Common Case*. I couldn’t find a good link that gives a complete overview of this concept, but from a [Compiler Optimization](https://en.wikipedia.org/wiki/Optimizing_compiler) Wikipedia page, it says the following:

> The common case may have unique properties that allow a [fast path](https://en.wikipedia.org/wiki/Fast_path) at the expense of a slow path. If the fast path is taken most often, the result is better overall performance.

This means that if you can improve something by 5% that happens 95% of the time, but it slows down the other 5% by 20% (sorry, lots of percents), then you actually get a net gain. We can use [Amdahl’s Law](https://en.wikipedia.org/wiki/Amdahl%27s_law) to calculate this:

```
1 / ((0.95/1.05) + (0.05/0.80)) = 1.0338
```

We gained over 3% in performance by making a small improvement in the common case, even at a rather large cost to the slow path.

I think this also easily translates to life without too much verbal gymnastics. If you are going to make improvements, make small ones that ripple through large portions of your life. Let’s make up a random example just to get a point across.

Lets say waking up early improves your life by 2% (uh… okay) and taking a shorter shower for some reason improves your life a whopping 50% (sure… fine). Waking up early will permeate through almost all of your life, lets say 96%, but showers take such a small portion of the day that it only improves your day by 3%. Which will have a better pay off? Let’s look use Amdahl's Law again to find out:

```
Waking up early: 1 / ((1 - 0.96) + (0.96 / 1.02)) = 1.0192 = ~2% increase
Shorter shower: 1 / ((1 - 0.03) + (0.03 / 1.50)) = 1.0101 = ~1% increase
```

This horrendously contrived example shows waking up early is nearly a 2x improvement over choosing to take shorter showers. Now, a couple of obvious points:
- All of those numbers are made up for the example
- It’s impossible to quantify what “better” actually means here
- It doesn’t take into account any actual goals you want to achieve

That said, I think general hand-waviness still gets the point across. Be intentional about the goals you want to set, then see if they only superficially improve your life or if they will have deep, lasting effects. These small improvements everyday life will have huge benefits when compounded over time.

This closely maps to an idea James Clear presents in [Atomic Habits](https://jamesclear.com/atomic-habits): 1% Better Every Day. It states that:

> It is so easy to overestimate the importance of one defining moment and underestimate the value of making small improvements on a daily basis. … Improving by 1 percent isn’t particularly notable — sometimes it isn’t even *noticeable* — but it can be far more meaningful, especially in the long run. The difference a tiny improvement can make over time is astounding.

He goes on to say that if you get 1 percent better each day for one year, you’ll end up thirty-seven times better than when you started. The flip side of that is if you get 1 percent worse each day for a year, you’ll decline to basically zero. We get so discouraged when our habits of going to the gym or improving a skill don’t seem to be bearing any fruit, but we need to remember the graph that I stole from his book:

{{< figure src="/1%_better_every_day.png" title="1% Better Everyday Graph from Atomic Habits">}}

The curve starts out really slow, almost imperceptible. But as the improvements compound over time, the effects are huge and you rocket blast to excellence.

I think his numbers are even more hand-wavy than mine, I mean, what does it even mean to improve 37x at something? If I jump 1% higher everyday, I should be able to jump to the moon by the end of the year (I’d say at the very least his graph should be a logistic curve rather than exponential - you can’t infinitely get better at something forever, its got to plateau). Even so, I think his underlying point is still valid and worth exploring when building new habits.

Even [Pragmatic Programmers](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/) talks about this. The book mentions finding small things to improve that will slowly accumulate over time. They give an example like learning keyboard shortcuts to your text editor so you don’t have to use a mouse at all. This is a small improvement, one shortcut at a time, but when you’re a developer spending hours a day in terminals and editors, the compound effect increases your productivity manyfold. If you start identifying small things to learn or automate, the sum of all of them over years will be huge.

The concept of optimizing for the common case shows that making little steps towards meaningful goals is far more impactful than one-time, short-lived stints that burn out as quickly as they started. Improvements take time, identify the things that can be optimized in your life and work to make tiny improvements. The sum of these changes will be profound, so just sit tight and [enjoy the process](/writings/enjoy-the-process).