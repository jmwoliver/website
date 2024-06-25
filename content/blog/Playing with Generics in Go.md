---
title: "Playing with Generics in Go: Making Event Payloads More Extensible"
date: Sat May 7 16:59:16 EDT 2022
---

With the advent of generics in [Go 1.18](https://go.dev/blog/go1.18), I wanted to spend some time getting familiar with them. At a previous job, I wrote a microservice in Go that handled incoming events from a message queue and looked at their type to determine what to do with them. When writing that service, I always felt like generics would be a good fit to ease some of the pains I had when implementing all the possible payload types. Since I don't work there anymore, I'll just shout into the void and write about it here instead.

In this post, I'll spend some time describing what generics are and how they work in Go. After that, I'll describe how I initially implemented handling event payloads in the microservice, then outline how I think generics would have been helpful. The example source code can be found on my [Github](https://github.com/jmwoliver/go-generics-example) if you would like to play with it yourself. Let's dig in!

# Overview of Generics

From the [Generic programming](https://en.wikipedia.org/wiki/Generic_programming) Wikipedia page, generics can be defined as:

> a style of computer programming in which algorithms are written in terms of types to-be-specified-later that are then instantiated when needed for specific types provided as parameters.

What does that mean? It basically says that you can write "generic" functions that work for many possible types, allowing them to be reused across any of those types. Let's use an example to help better understand.

Suppose we wanted to write a function to find the max of two numbers without generics. If you wanted to find the max of two integers, you would probably write a function like:

```go
func max(x, y int64) int64 {
    if x > y {
        return x
    }
    return y
}
```

But what if you wanted to do this for floats as well? No problem, lets rename the function above to `maxInt()` and then create a `maxFloat()` function:

```go
func maxFloat(x, y float64) float64 {
    if x > y {
        return x
    }
    return y
}
```

These functions are identical though, the only thing that differentiates them is the type passed in. What if you could use the same function for both `int64` and `float64` variables? That's where "types to-be-specified-later" and generics come in. In Go 1.18, now you can write the function as the following:

```go
func max[T int64 | float64](x, y T) T {
	if x > y {
		return x
	}
	return y
}
```

In the above, `T` is a type that is determined at compile time, allowing both `int64` and `float64` variables types. Neat! With this generic function, you could call `max()` from either an `int64` or `float64` and both will work:

```go
var x, y int64
x = 12
y = 20
max1 := max(x, y) // This will work and return max1 = 20

var w, z float64
w = 39.30
z = 11.58
max2 := max(w, z) // This will also work and return max2 = 39.30
```

As you can see, generics can be a powerful tool to help define functions in a common way that allows many types to use them.

In the subsequent sections, I'll outline a use-case I think generics help simplify - handling many types of event payloads.

# The Initial Implementation

Like I mentioned above, at a previous job, I wrote a microservice that would handle incoming events and decide what to do with them depending on their payload type. This led to using [type switches](https://go.dev/tour/methods/16) to determine the incoming payload type. To give a rough overview of what this might look like, I'll define a few `struct`s:

```go
type PassivePayload struct {
	id int
}

type DirectedPayload struct {
	id int
}
```

These `struct`s could be implemented by an overarching `interface` that requires a `send()` method:

```go
func (pp PassivePayload) send() {
	fmt.Printf("PassivePayload.send(%d)\n", pp.id)
}

func (dp DirectedPayload) send() {
	fmt.Printf("DirectedPayload.send(%d)\n", dp.id)
}
```

When a service would recieve incoming events, it would have to use the type switches to determine how to handle the payload:

```go
func SendEvent(payload interface{}) {
	switch t := payload.(type) {
	case PassivePayload:
		passivePayload, ok := payload.(PassivePayload)
		if ok {
			passivePayload.send()
		}
	case DirectedPayload:
		directedPayload, ok := payload.(DirectedPayload)
		if ok {
			directedPayload.send()
		}
	default:
		fmt.Printf("Type unknown: %v\n", t)
	}
}
```

This solution isn't bad, but the real pain came when adding more payload types. There was a common library that contained all of the event payload structures, so adding support for a new payload type meant adding it into the common event library, then, in the service, checking for every type to determine what to do with it. Let's see if generics can help alleviate some of these issues.

# Improved Implementation with Generics

Let's keep the same `PassivePayload` and `DirectedPayload` `struct`s we had above. But now in addition to those, we can add the following `interface`:

```go
type Payload interface {
	PassivePayload | DirectedPayload
	send()
}
```

This `interface` requires the `send()` method we already implemented, but it also adds `PassivePayload | DirectedPayload` - this is where generics start to come in. This `interface` is now saying that if the `Payload` type is used as a generic, the object calling it must either be a `PassivePayload` or a `DirectedPayload`. Let's see how this helps us clean up the `SendEvent()` function:

```go
func SendEvent[T Payload](payload T) {
	payload.send()
}
```

Whoa, nice! That's a lot cleaner. Now `SendEvent()` doesn't have to have any knowledge of the payload types, and all that has to happen to support a new payload type is add it to the `Payload` `interface`. This allows each payload type to worry about their implementation and the service to just call `SendEvent()` without caring about the type, reducing the changes required across common libraries and services implementing those libraries.