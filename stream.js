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
 * SpeedoStream extraction - HTTP Scraping (like HDHub4u)
 * 
 * Flow (from RPA recording):
 * 1. POST to page with form data {imhuman: ""}
 * 2. Parse result for quality links (/d/{id}_x for UHD, /d/{id}_l for SD)
 * 3. POST to quality page with form
 * 4. Extract "Direct Download Link" (MP4 URL from ydc1wes.me)
 */
function getSpeedoStreamExtraction(link) {
  console.log("SpeedoStream HTTP extraction:", link);

  try {
    var speedoHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://prmovies.delivery/",
      "Accept": "text/html,application/xhtml+xml",
      "Content-Type": "application/x-www-form-urlencoded"
    };

    // Step 1: POST to the page with imhuman form field
    console.log("Step 1: POST to SpeedoStream page");
    var response1 = axios.post(link, "imhuman=", { headers: speedoHeaders });
    var html1 = response1.data;

    // Parse for quality download links
    var $ = cheerio.load(html1);
    var streams = [];

    // Look for download quality links like /d/{id}_x (UHD), /d/{id}_l (SD)
    var qualityLinks = [];
    $("a[href*='/d/']").each(function () {
      var href = $(this).attr("href") || "";
      var text = $(this).text().trim();
      if (href.indexOf("/d/") !== -1) {
        qualityLinks.push({
          href: href,
          text: text,
          quality: text.toLowerCase().indexOf("uhd") !== -1 ? "UHD" :
            text.toLowerCase().indexOf("low") !== -1 ? "SD" : "HD"
        });
      }
    });

    console.log("Quality links found:", qualityLinks.length);

    // Also check for direct download links on the page
    $("a[href*='ydc1wes.me'], a[href*='.mp4']").each(function () {
      var href = $(this).attr("href") || "";
      if (href.indexOf(".mp4") !== -1 || href.indexOf("ydc1wes.me") !== -1) {
        streams.push({
          server: "Direct Download",
          link: href,
          type: "direct",
          quality: "HD",
          headers: { "Referer": link }
        });
      }
    });

    // If we found direct links, return them
    if (streams.length > 0) {
      console.log("Found direct MP4 links:", streams.length);
      return streams;
    }

    // Process quality links - try to get download URLs
    for (var i = 0; i < qualityLinks.length && i < 3; i++) {
      var qLink = qualityLinks[i];
      var fullUrl = qLink.href;
      if (fullUrl.indexOf("http") !== 0) {
        // Make absolute URL
        var baseMatch = link.match(/^(https?:\/\/[^\/]+)/);
        if (baseMatch) {
          fullUrl = baseMatch[1] + qLink.href;
        }
      }

      console.log("Processing quality link:", qLink.quality, fullUrl);

      try {
        // Step 3: GET the /d/ page first (load it)
        speedoHeaders["Referer"] = link;
        console.log("GET /d/ page first");
        var getResp = axios.get(fullUrl, { headers: speedoHeaders });

        // Step 4: POST to same page (submit "Download File" form)
        speedoHeaders["Referer"] = fullUrl;
        console.log("POST to /d/ page");
        var response2 = axios.post(fullUrl, "imhuman=", { headers: speedoHeaders });
        var html2 = response2.data;
        var $2 = cheerio.load(html2);

        // Step 5: Look for Direct Download Link
        $2("a[href*='ydc1wes.me'], a[href*='.mp4'], a:contains('Direct Download')").each(function () {
          var dlHref = $2(this).attr("href") || "";
          if (dlHref && (dlHref.indexOf(".mp4") !== -1 || dlHref.indexOf("ydc1wes.me") !== -1)) {
            streams.push({
              server: "SpeedoStream " + qLink.quality,
              link: dlHref,
              type: "direct",
              quality: qLink.quality,
              headers: { "Referer": fullUrl }
            });
            console.log("Direct link found:", dlHref.substring(0, 80));
          }
        });
      } catch (qErr) {
        console.error("Quality page error:", qErr.message || qErr);
      }
    }

    if (streams.length > 0) {
      console.log("Extracted", streams.length, "streams");
      return streams;
    }

    // Fallback: use WebView automation for direct page
    // SpeedoStream embeds are disabled, so we use direct page with button click
    console.log("Fallback to WebView automation");
    return [{
      server: "SpeedoStream",
      link: link,
      type: "automate",
      quality: "HD",
      automation: {
        steps: [
          // Click "Proceed to video" button
          { action: "clickElement", selector: "#btn_download, input[name='imhuman']" }
        ]
      }
    }];

  } catch (err) {
    console.error("SpeedoStream extraction error:", err);
    return [];
  }
}

/**
 * StreamWish extraction - uses m3u8 interception for native playback
 */
function getStreamWishExtraction(link) {
  console.log("Creating StreamWish extraction:", link);
  return [{
    server: "StreamWish",
    link: link,
    type: "automate",
    quality: "HD",
    automation: {
      steps: [{ action: "waitForElement", selector: "video", timeout: 15000 }]
    }
  }];
}

/**
 * FileLions extraction - uses m3u8 interception
 */
function getFileLionsExtraction(link) {
  console.log("Creating FileLions extraction:", link);
  return [{
    server: "FileLions",
    link: link,
    type: "automate",
    quality: "HD",
    automation: {
      steps: [{ action: "waitForElement", selector: "video", timeout: 15000 }]
    }
  }];
}

/**
 * StreamTape extraction - uses m3u8 interception
 */
function getStreamTapeExtraction(link) {
  console.log("Creating StreamTape extraction:", link);
  return [{
    server: "StreamTape",
    link: link,
    type: "automate",
    quality: "HD",
    automation: {
      steps: [{ action: "waitForElement", selector: "video", timeout: 15000 }]
    }
  }];
}

/**
 * DoodStream extraction - uses m3u8 interception
 */
function getDoodStreamExtraction(link) {
  console.log("Creating DoodStream extraction:", link);
  return [{
    server: "DoodStream",
    link: link,
    type: "automate",
    quality: "HD",
    automation: {
      steps: [{ action: "waitForElement", selector: "video", timeout: 15000 }]
    }
  }];
}

/**
 * MixDrop extraction - uses m3u8 interception
 */
function getMixDropExtraction(link) {
  console.log("Creating MixDrop extraction:", link);
  return [{
    server: "MixDrop",
    link: link,
    type: "automate",
    quality: "HD",
    automation: {
      steps: [{ action: "waitForElement", selector: "video", timeout: 15000 }]
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
