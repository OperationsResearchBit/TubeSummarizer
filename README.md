# TubeSummarizer 

agpl3 

https://OperationsResearchBit.github.io/TubeSummarizer/

For Substack newsletter:

https://substack.com/@operationsresearchbit

to do: </br> 
- remove the api key and use regular summarizer 

---

use this script in console of your youtube playlist to get video IDs  

 ```// Paste this directly into your browser console on the YouTube page
const videoIds = new Set();
const videoElements = document.querySelectorAll('a[href*="watch?v="]'); // Targets watch links

videoElements.forEach(el => {
  const href = el.getAttribute('href');
  if (href) {
    try {
      const url = new URL(href, window.location.origin); 
      const id = url.searchParams.get('v');
      if (id && id.length === 11) {
        videoIds.add(id);
      }
    } catch (e) {}
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

v2

---

## Setup v1 (archived) 

Pick Gemini or OpenAI, paste your own API key (stored only in your browser via localStorage if you check "remember"), set your newsletter's name/voice/CTA

Pick videos — load a playlist URL, or paste individual video links (untick anything you don't want)

Generate — for each video it fetches the page, pulls the transcript, and asks the AI to write a short, non-plagiarized write-up in your voice (like the original app's rules: third person, own wo[...]

Draft — one final AI call writes subject-line options + an intro/outro that ties the videos together thematically, then assembles everything into an editable Markdown newsletter you can preview,[...]

