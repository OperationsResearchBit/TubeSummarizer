// STOPWORDS
// Pure data. Add or remove a word here and nothing else needs to
// change. Three buckets kept separate so it's obvious what each is
// filtering:
//   common      -> ordinary English function words
//   boilerplate -> website/player chrome that leaks into transcripts
//   filler      -> high-frequency but low-information content words

export const STOPWORDS = {
  common: new Set([
    "a","about","above","after","again","all","also","am","an","and","any","are","as","at",
    "be","because","been","before","being","between","both","but","by","can","did","do",
    "does","doing","during","each","for","from","further","get","got","had","has","have",
    "having","he","her","here","him","his","how","i","if","in","into","is","it","its",
    "just","know","let","like","me","more","most","my","no","not","now","of","off","on",
    "once","only","or","other","our","out","over","own","re","said","same","she","should",
    "so","some","such","than","that","the","their","them","then","there","these","they",
    "this","those","through","to","too","under","until","up","very","was","we","were",
    "what","when","where","which","while","who","will","with","would","you","your",
    "uh","um","yeah","okay","ok","gonna","gotta","wanna","kinda","sorta","actually",
    "basically","literally","really","right","mean","think","going","want","need"
  ]),
  boilerplate: new Set([
    "https","http","www","youtube","youtu","com","org","net","transcript","transcripts",
    "caption","captions","subtitle","subtitles","video","videos","watch","watching","watched",
    "channel","subscribe","subscribed","subscribing","click","link","links","description",
    "below","above","comment","comments","notification","notifications","bell","icon"
  ]),
  filler: new Set([
    "make","made","making","makes","sure","still","seen","see","saw","look","looking",
    "looked","looks","example","examples","exactly","probably","maybe","kind","kinds",
    "sort","sorts","thing","things","stuff","lot","lots","way","ways","place","places",
    "taking","take","taken","takes","took","back","come","comes","coming","came","put",
    "puts","putting","else","everything","something","anything","nothing","someone",
    "anyone","everyone","nobody","quite","pretty","little","big","small","good","great",
    "well","better","best","worse","worst","thank","thanks","please","welcome","hello",
    "hey","guys","folks","everybody","truly","impressive","incredible","amazing","awesome",
    "fantastic","wonderful","terrible","horrible","huge","massive","tiny","definitely",
    "certainly","absolutely","totally","completely","obviously","clearly","honestly",
    "essentially","ultimately","first","second","third","next","last","one","two","three",
    "four","five","six","seven","eight","nine","ten"
  ]),
  // 10-12 char ID-like tokens (e.g. "Lz9lh3qypo8") that leak in via embedded links.
  idLike: /^[a-z0-9_-]{10,12}$/
};
