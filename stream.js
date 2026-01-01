// PRMovies Stream Module - DOM-only extraction
// 
// PRMovies uses speedostream, streamwish, filelions etc for hosting
// These are direct embed players - we extract the video source from them
//
// FLOW:
// 1. speedostream/streamwish page → extract video source from player
// 2. For packed JS, decode and find the source URL

var headers = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Referer": "https://prmovies.delivery/"
};

/**
 * Get streams for a given link
 * Returns DOM extraction rules for the hidden browser
 */
function getStreams(link, type) {
  console.log("getStreams called with:", link);
  
  // SpeedoStream - most common on PRMovies
  if (link.indexOf("speedostream") !== -1) {
    return getSpeedoStreamExtraction(link);
  }
  
  // StreamWish
  if (link.indexOf("streamwish") !== -1 || link.indexOf("swdyu") !== -1) {
    return getStreamWishExtraction(link);
  }
  
  // FileLions
  if (link.indexOf("filelions") !== -1 || link.indexOf("alions") !== -1) {
    return getFileLionsExtraction(link);
  }
  
  // StreamTape
  if (link.indexOf("streamtape") !== -1 || link.indexOf("stape") !== -1) {
    return getStreamTapeExtraction(link);
  }
  
  // DoodStream
  if (link.indexOf("doodstream") !== -1 || link.indexOf("dood.") !== -1) {
    return getDoodStreamExtraction(link);
  }
  
  // MixDrop
  if (link.indexOf("mixdrop") !== -1) {
    return getMixDropExtraction(link);
  }
  
  // Unknown - try generic video extraction
  console.log("Unknown link type, trying generic extraction");
  return getGenericVideoExtraction(link);
}

/**
 * SpeedoStream extraction
 * SpeedoStream embeds video URL in jwplayer.setup() JavaScript
 * Uses HTTP extraction instead of DOM automation to avoid popup ads
 */
function getSpeedoStreamExtraction(link) {
  console.log("Creating SpeedoStream extraction:", link);
  
  return [{
    server: "SpeedoStream",
    link: link,
    type: "http",
    automation: JSON.stringify({
      extraction: {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://prmovies.delivery/"
        },
        patterns: [
          "sources:\\s*\\[\\s*\\{\\s*file\\s*:\\s*[\"']([^\"']+\\.m3u8[^\"']*)",
          "file\\s*:\\s*[\"']([^\"']+\\.m3u8[^\"']*)[\"']"
        ],
        videoHeaders: {
          "Referer": "https://speedostream1.com/"
        }
      }
    })
  }];
}

/**
 * StreamWish extraction
 */
function getStreamWishExtraction(link) {
  console.log("Creating StreamWish extraction:", link);
  
  return [{
    server: "StreamWish",
    link: link,
    type: "automate",
    automation: {
      steps: [
        {
          action: "extractUrl",
          selectors: [
            "video source[src]",
            "video[src]",
            "source[src*='.m3u8']"
          ],
          attribute: "src",
          patterns: [".m3u8", ".mp4"]
        },
        {
          action: "extractFromScript",
          patterns: [
            "file:\\s*[\"']([^\"']+\\.m3u8[^\"']*)[\"']",
            "sources:\\s*\\[\\{[^}]*file:[\"']([^\"']+)[\"']"
          ]
        }
      ]
    }
  }];
}

/**
 * FileLions extraction
 */
function getFileLionsExtraction(link) {
  console.log("Creating FileLions extraction:", link);
  
  return [{
    server: "FileLions",
    link: link,
    type: "automate",
    automation: {
      steps: [
        {
          action: "extractUrl",
          selectors: [
            "video source[src]",
            "video[src]"
          ],
          attribute: "src",
          patterns: [".m3u8", ".mp4"]
        },
        {
          action: "extractFromScript",
          patterns: [
            "file:\\s*[\"']([^\"']+\\.m3u8[^\"']*)[\"']",
            "sources.*file:[\"']([^\"']+)[\"']"
          ]
        }
      ]
    }
  }];
}

/**
 * StreamTape extraction
 * StreamTape uses a different mechanism with token-based URLs
 */
function getStreamTapeExtraction(link) {
  console.log("Creating StreamTape extraction:", link);
  
  return [{
    server: "StreamTape",
    link: link,
    type: "automate",
    automation: {
      steps: [
        {
          action: "extractUrl",
          selectors: [
            "video#mainvideo source[src]",
            "video source[src]",
            "video[src]"
          ],
          attribute: "src",
          patterns: [".mp4", "streamtape"]
        },
        {
          action: "extractFromScript",
          patterns: [
            "getElementById\\(['\"]robotlink['\"]\\)\\.innerHTML\\s*=\\s*[\"']([^\"']+)[\"']",
            "document\\.getElementById\\('robotlink'\\)\\.innerHTML\\s*\\+\\s*'([^']+)'"
          ]
        }
      ]
    }
  }];
}

/**
 * DoodStream extraction
 */
function getDoodStreamExtraction(link) {
  console.log("Creating DoodStream extraction:", link);
  
  return [{
    server: "DoodStream",
    link: link,
    type: "automate",
    automation: {
      steps: [
        {
          action: "extractUrl",
          selectors: [
            "video source[src]",
            "video[src]"
          ],
          attribute: "src",
          patterns: [".mp4", ".m3u8"]
        },
        {
          action: "extractFromScript",
          patterns: [
            "dsplayer\\.hotkeys[^;]+source:\\s*[\"']([^\"']+)[\"']",
            "\\.get\\([\"']([^\"']+/pass_md5/[^\"']+)[\"']"
          ]
        }
      ]
    }
  }];
}

/**
 * MixDrop extraction
 */
function getMixDropExtraction(link) {
  console.log("Creating MixDrop extraction:", link);
  
  return [{
    server: "MixDrop",
    link: link,
    type: "automate",
    automation: {
      steps: [
        {
          action: "extractUrl",
          selectors: [
            "video source[src]",
            "video[src]"
          ],
          attribute: "src",
          patterns: [".mp4", ".m3u8"]
        },
        {
          action: "extractFromScript",
          patterns: [
            "MDCore\\.wurl\\s*=\\s*[\"']([^\"']+)[\"']",
            "wurl\\s*=\\s*[\"']([^\"']+)[\"']"
          ]
        }
      ]
    }
  }];
}

/**
 * Generic video extraction for unknown players
 */
function getGenericVideoExtraction(link) {
  console.log("Creating generic video extraction:", link);
  
  return [{
    server: "Video",
    link: link,
    type: "automate",
    automation: {
      steps: [
        // Try to find video element
        {
          action: "extractUrl",
          selectors: [
            "video source[src*='.m3u8']",
            "video source[src*='.mp4']",
            "video[src*='.m3u8']",
            "video[src*='.mp4']",
            "video source[src]",
            "video[src]",
            "source[src]"
          ],
          attribute: "src",
          patterns: [".m3u8", ".mp4", "master"]
        },
        // Try to find in scripts
        {
          action: "extractFromScript",
          patterns: [
            "file:\\s*[\"']([^\"']+\\.m3u8[^\"']*)[\"']",
            "file:\\s*[\"']([^\"']+\\.mp4[^\"']*)[\"']",
            "source:\\s*[\"']([^\"']+\\.m3u8[^\"']*)[\"']",
            "source:\\s*[\"']([^\"']+\\.mp4[^\"']*)[\"']",
            "src:\\s*[\"']([^\"']+\\.m3u8[^\"']*)[\"']",
            "src:\\s*[\"']([^\"']+\\.mp4[^\"']*)[\"']",
            "sources:\\s*\\[\\{[^}]*file:[\"']([^\"']+)[\"']"
          ]
        }
      ]
    }
  }];
}

/**
 * Try to resolve stream URL directly via HTTP (for simple cases)
 */
function tryDirectExtract(link) {
  try {
    var response = axios.get(link, { headers: headers, timeout: 10000 });
    var html = response.data;
    
    // Look for m3u8 or mp4 URLs
    var patterns = [
      /file:\s*["']([^"']+\.m3u8[^"']*)['"]/i,
      /source:\s*["']([^"']+\.m3u8[^"']*)['"]/i,
      /file:\s*["']([^"']+\.mp4[^"']*)['"]/i
    ];
    
    for (var i = 0; i < patterns.length; i++) {
      var match = html.match(patterns[i]);
      if (match && match[1]) {
        console.log("Direct extract found:", match[1].substring(0, 50));
        return [{
          server: "Direct",
          link: match[1],
          type: "direct"
        }];
      }
    }
  } catch (e) {
    console.error("Direct extract failed:", e);
  }
  
  return null;
}
