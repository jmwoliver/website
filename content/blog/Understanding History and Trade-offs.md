---
title: "Understanding History and Trade-offs"
date: Wed Jan 11 16:37:43 EST 2023
---

## There Are No Zero-cost Abstractions

I recently watched Chandler Carruth's excellent talk entitled [“There Are No Zero-cost Abstractions”](https://youtu.be/rHIkrotSwcc). In it, he outlines that there are no abstractions in programming that are truly zero cost. He says there are three categories in which this cost can end up:

1) Compile time cost
2) Run time cost
3) Human cost

Chandler's premise is that the cost doesn't go to zero, but rather, it just gets shuffled around. You may be able to make an abstraction that is zero cost in one dimension (e.g. compile time doesn't increase), but then runtime is slower or readability is worsened.

I agree with the points he is making, but I think the human cost goes even deeper than he describes.

## Understanding History and Trade-offs

He talks about the human cost with respect to "how will a human be able to understand and use this?", but I think the human cost also relates to understanding *why* it is done the way it is to begin with. Understanding the history of why, as well as how it was done prior, better helps know the trade-offs and when to use that tool. What would motivate someone to write a new methodology for doing something?

- C came about because it was tedious to write Assembly, so C provides something far more human-readable and you can allocate variables without worrying which registers they need to be loaded in to. But there are still cases when you embed Assembly in C.
- A reason why Java got popular is the garbage collector, now you don't have to worry about memory management at all. In C you had to `malloc` and `free` explicitly, but the garbage collector does it for free now (cheeky use of "free" intented). But you wouldn't use Java on a self-driving car unless you were fine with the car crashing ever so often because a stop-the-world event occurred while trying to determine if the object in front of it was a car. 

As illustrated above, there is no silver bullet. Something can be improved in one dimension, but worsened in another. Think about the how that thing solves the particular problem it was trying to solve and what trade-offs were made in pursuit of that. In the case of garbage collection, maybe your application isn't mission critical and a few stop-the-world events every once in a while is fine. But when you don’t know *why* an abstraction was made originally, there becomes the ability to misuse it. Instead, understand the use-case of the tool and use it within that context. Doing that will give better insight into the uses of that thing and the trade-offs of when it should or shouldn't be used.