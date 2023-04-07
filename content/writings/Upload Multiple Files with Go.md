---
title: "Upload Multiple Files with Go"
date: Sat Apr 30 11:55:38 EDT 2022
tags: [Go]
---

I was recently working on a feature that would allow a client to upload multiple files to a server. There was already a method to upload one file with a `POST` of type `multipart/form-data`, but it was limiting to upload one file at a time. Because of this, I started looking at what the best method would be to handle uploading multiple files in bulk. I tried a few different approaches until I stumbled upon the fact that `multipart/form-data` already supports uploading multiple files in one request. A [client/server demo can be pulled from Github](https://github.com/jmwoliver/multifile-upload) if you want to try it out for yourself. I'll describe below some of my journey to get to this solution.

# Naive Approach

My first approach was pretty simple - create a worker pool of threads and upload each file concurrently and independently. This worked pretty well because none of the server code had to change. All that was required was basically throwing each file path into a Go `channel` and letting the worker threads make the API calls.

Through more discussion, I found there was a requirement of adding all of these files to the database in a single transaction. With the naive approach, I was making `N` seperate calls to the API and `N` seperate commits to the database without an easy way of saying "hey all of these are related and should be counted as one transaction." So although this method worked well and was easy to implement, I needed a different approach to meet the necessary requirements.

# Better Approach

It took some Ducking around (because I don't use Google and am trying to normalize DuckDuckGo), but I eventually came across how to use the `multipart/form-data` that was already implemented and extend it to include all the files in one request. The client-side code looks like:

```go
func Entry(filePath string) {
	err := upload(filePath)
	if err != nil {
		log.Fatalln(err)
	}
}

func upload(filePath string) error {
	sanitizedPath := strings.ReplaceAll(filePath, " ", "")
	paths := strings.Split(sanitizedPath, ",")

	r, w := io.Pipe()
	m := multipart.NewWriter(w)

	go func() {
		defer func() {
			// m.Close() is important so the requset knows the boundary
			m.Close()
			w.Close()
		}()
		for i, path := range paths {
			f, err := os.Open(path)
			if err != nil {
				fmt.Println(err)
				return
			}
			defer f.Close()
			fileKey := fmt.Sprintf("file%d", i)
			if fw, err := m.CreateFormFile(fileKey, f.Name()); err != nil {
				return
			} else {
				if _, err = io.Copy(fw, f); err != nil {
					return
				}
			}
		}
	}()

	url := fmt.Sprintf("http://%s/upload", addr)
	req, _ := http.NewRequest("POST", url, r)
	req.Header.Add("Content-Type", m.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()
	fmt.Printf("Successfully uploaded %d file(s)!\n", len(paths))
	return nil
}
```

And the server receives those files with the following:

```go
func handleUpload(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10)
	mpf := r.MultipartForm

	for fileKey := range mpf.File {
		file, fileHeader, err := r.FormFile(fileKey)
		if err != nil {
			log.Fatalf("Failed to get file '%s' from MultipartForm\n", fileKey)
		}
		defer file.Close()
		fmt.Printf("Uploading '%s' to server...\n", fileHeader.Filename)

		path := "./server/files/" + fileHeader.Filename
		out, err := os.Create(path)
		if err != nil {
			log.Fatalf("Failed to open the path '%s'\n", path)
		}
		defer out.Close()
		_, err = io.Copy(out, file)
		if err != nil {
			log.Fatalln(err)
		}
	}

	fmt.Println("Successfully uploaded file(s) to server!")
}

func Entry() {
	// Need to make the ./server/files/ directory
	// with write permissions if it doesn't exist
	os.MkdirAll("./server/files", 0700)

	http.HandleFunc("/upload", handleUpload)
	http.ListenAndServe(":8080", nil)
}
```

Pretty nifty! I had worked with `multipart/form-data` in the past, but didn't realize it could be extended in that way. Now it works for 1 to `N` files without any issues. This also helped satisfy the requirement of handling all related file uploads in one API call so the database can know that each file in a call is related to tie them to the same commit.