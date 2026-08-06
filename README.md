# TubeSummarizer

agpl3 


For Substack newsletter:

https://substack.com/@operationsresearchbit

to do: </br> 
- remove the api key and use regular summarizer 

---

use this script in console of your youtube playlist to get video IDs  

 ```const videoElements = document.querySelectorAll('a#video-title, a#video-title-link, a[href*="/watch?v="]');
const videoIds = new Set();

videoElements.forEach(el => {
    const href = el.getAttribute('href');
    if (href) {
        const urlParams = new URLSearchParams(href.split('?')[1]);
        const id = urlParams.get('v');
        if (id && id.length === 11) {
            videoIds.add(id);
        }
    }
});

console.log("--- Extracted YouTube Video IDs ---");
console.log(Array.from(videoIds).join('\n'));
console.log(`Total Unique Videos Found: ${videoIds.size}`);

```

### Structure 

```playlist-summarizer/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── config.js
    ├── stopwords.js
    ├── nlp.js
    ├── summarizer.js
    ├── transcript.js
    ├── ui.js
    └── app.js
```


---

## Setup v1 (archived) 

Pick Gemini or OpenAI, paste your own API key (stored only in your browser via localStorage if you check "remember"), set your newsletter's name/voice/CTA

Pick videos — load a playlist URL, or paste individual video links (untick anything you don't want)

Generate — for each video it fetches the page, pulls the transcript, and asks the AI to write a short, non-plagiarized write-up in your voice (like the original app's rules: third person, own words, no bullet points)

Draft — one final AI call writes subject-line options + an intro/outro that ties the videos together thematically, then assembles everything into an editable Markdown newsletter you can preview, copy, or download as .md/.html

