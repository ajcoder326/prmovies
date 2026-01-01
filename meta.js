// PRMovies Meta Module - SYNCHRONOUS VERSION for Rhino JS
// Extracts movie details and streaming links from PRMovies

var headers = {
  "Referer": "https://google.com",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
};

function getMetaData(link, providerContext) {
  console.log("getMetaData called - link:", link);

  try {
    var response = axios.get(link, { headers: headers });

    if (!response || !response.data) {
      console.error("No meta response data");
      return createEmptyMeta();
    }

    var $ = cheerio.load(response.data);

    // PRMovies PsyPlay theme uses specific selectors
    // Extract title from .mvic-desc h3 or og:title
    var title = "";
    var titleEl = $(".mvic-desc h3[itemprop='name']").first();
    if (titleEl.length > 0) {
      title = titleEl.text().trim();
    }
    // Fallback to og:title
    if (!title) {
      var ogTitle = $('meta[property="og:title"]').attr("content");
      if (ogTitle) {
        title = ogTitle.trim();
      }
    }
    // Last fallback to page title
    if (!title) {
      title = $("title").text().trim().split(" - ")[0];
    }
    // Clean up title
    title = title.replace(/Download.*$/i, "").trim();
    title = title.replace(/Watch Online.*$/i, "").trim();
    title = title.replace(/Full Movie.*$/i, "").trim();
    console.log("Title found:", title ? title.substring(0, 40) : "none");

    // Determine content type
    var type = "movie";
    var lowerTitle = title.toLowerCase();
    if (lowerTitle.indexOf("season") !== -1 || lowerTitle.indexOf("episode") !== -1) {
      type = "series";
    }

    // Extract poster image from .mvic-thumb or og:image
    var image = "";
    var posterImg = $(".mvic-thumb img[itemprop='image']").first();
    if (posterImg.length > 0) {
      image = posterImg.attr("src") || posterImg.attr("data-src") || "";
    }
    // Fallback to og:image
    if (!image) {
      var ogImage = $('meta[property="og:image"]').attr("content");
      if (ogImage) {
        image = ogImage;
      }
    }
    console.log("Image found:", image ? image.substring(0, 50) : "none");

    // Extract synopsis/description from .f-desc or og:description
    var synopsis = "";
    var synopsisEl = $(".mvic-desc .f-desc, .desc .f-desc, p.f-desc").first();
    if (synopsisEl.length > 0) {
      synopsis = synopsisEl.text().trim();
    }
    // Fallback - try og:description
    if (!synopsis || synopsis.length < 20) {
      var ogDesc = $('meta[property="og:description"]').attr("content");
      if (ogDesc) {
        synopsis = ogDesc.trim();
      }
    }
    // Fallback - try meta description
    if (!synopsis || synopsis.length < 20) {
      var metaDesc = $('meta[name="description"]').attr("content");
      if (metaDesc) {
        synopsis = metaDesc.trim();
      }
    }
    if (!synopsis || synopsis.length < 20) {
      synopsis = "Watch " + (title || "content") + " online in HD quality.";
    }
    console.log("Synopsis length:", synopsis.length);

    // Extract metadata (genre, year, rating, etc.)
    var genres = [];
    var genreLinks = $('a[href*="/genre/"]');
    for (var g = 0; g < genreLinks.length && g < 10; g++) {
      var genreText = genreLinks.eq(g).text().trim();
      if (genreText && genres.indexOf(genreText) === -1) {
        genres.push(genreText);
      }
    }

    // Extract year
    var year = "";
    var yearLink = $('a[href*="/release-year/"]').first();
    if (yearLink.length > 0) {
      year = yearLink.text().trim();
    }
    if (!year) {
      var yearMatch = title.match(/\((\d{4})\)/);
      if (yearMatch) {
        year = yearMatch[1];
      }
    }

    // Extract rating (IMDb)
    var rating = "";
    var ratingText = $(".imdb, .rating, .vote").text();
    if (ratingText) {
      var ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      if (ratingMatch) {
        rating = ratingMatch[1];
      }
    }

    // Extract duration
    var duration = "";
    var durationText = $(".runtime, .duration").text();
    if (durationText) {
      var durationMatch = durationText.match(/(\d+)\s*min/i);
      if (durationMatch) {
        duration = durationMatch[1] + " min";
      }
    }

    // Extract director
    var director = "";
    var directorLink = $('a[href*="/director/"]').first();
    if (directorLink.length > 0) {
      director = directorLink.text().trim();
    }

    // Extract cast
    var cast = [];
    var castLinks = $('a[href*="/stars/"]');
    for (var c = 0; c < castLinks.length && c < 10; c++) {
      var actorName = castLinks.eq(c).text().trim();
      if (actorName && cast.indexOf(actorName) === -1) {
        cast.push(actorName);
      }
    }

    // ============================================
    // EXTRACT STREAMING/DOWNLOAD LINKS (linkList)
    // ============================================
    var linkList = [];
    var directLinks = [];

    // PRMovies PsyPlay theme uses .lnk-lnk class for download links
    // Also check #list-dl section and iframe sources
    var downloadLinks = $("#list-dl a.lnk-lnk, .lnk-lnk, a[href*='speedostream']");
    console.log("Download links found:", downloadLinks.length);

    for (var s = 0; s < downloadLinks.length && s < 50; s++) {
      var anchor = downloadLinks.eq(s);
      var href = anchor.attr("href") || "";
      var linkText = anchor.text().trim();
      
      // Skip invalid links
      if (!href || href === "#" || href.indexOf("javascript:") === 0) continue;
      if (href.indexOf("http") !== 0) continue;
      
      // Skip social/sharing links
      if (href.indexOf("facebook.") !== -1 || 
          href.indexOf("twitter.") !== -1 ||
          href.indexOf("telegram.") !== -1 ||
          href.indexOf("instagram.") !== -1) continue;

      // Check if it's a streaming link (speedostream, etc.)
      if (href.indexOf("speedostream") !== -1 || 
          href.indexOf("streamwish") !== -1 ||
          href.indexOf("filelions") !== -1 ||
          href.indexOf("streamtape") !== -1 ||
          href.indexOf("doodstream") !== -1 ||
          href.indexOf("mixdrop") !== -1) {
        
        // Try to extract quality from link text or sibling spans
        var quality = "";
        var qualityMatch = linkText.match(/(\d{3,4}p|HD|4K)/i);
        if (qualityMatch) {
          quality = qualityMatch[0].toUpperCase();
        }
        
        // Check sibling spans for quality info (PRMovies structure)
        var qualitySpan = anchor.find(".lnk-dl").last();
        if (qualitySpan.length > 0) {
          var spanText = qualitySpan.text().trim();
          var spanQualityMatch = spanText.match(/(\d{3,4}p|HD)/i);
          if (spanQualityMatch && !quality) {
            quality = spanQualityMatch[0].toUpperCase();
          }
        }

        // Determine server name
        var server = "Stream";
        if (href.indexOf("speedostream") !== -1) server = "SpeedoStream";
        else if (href.indexOf("streamwish") !== -1) server = "StreamWish";
        else if (href.indexOf("filelions") !== -1) server = "FileLions";
        else if (href.indexOf("streamtape") !== -1) server = "StreamTape";
        else if (href.indexOf("doodstream") !== -1) server = "DoodStream";
        else if (href.indexOf("mixdrop") !== -1) server = "MixDrop";

        var linkTitle = server;
        if (quality) {
          linkTitle = server + " " + quality;
        }

        directLinks.push({
          title: linkTitle,
          link: href,
          quality: quality,
          type: "stream"
        });
      }
    }

    // Also check for iframe sources (embedded players)
    var iframes = $("iframe[src]");
    for (var f = 0; f < iframes.length; f++) {
      var iframeSrc = iframes.eq(f).attr("src") || "";
      if (iframeSrc.indexOf("speedostream") !== -1 ||
          iframeSrc.indexOf("streamwish") !== -1 ||
          iframeSrc.indexOf("filelions") !== -1) {
        
        var iframeServer = "Embedded Player";
        if (iframeSrc.indexOf("speedostream") !== -1) iframeServer = "SpeedoStream";
        
        directLinks.push({
          title: iframeServer,
          link: iframeSrc,
          type: "stream"
        });
      }
    }

    console.log("Direct links found:", directLinks.length);

    // Build linkList structure
    if (directLinks.length > 0) {
      // Group by quality if available
      var hdLinks = [];
      var sdLinks = [];
      var otherLinks = [];

      for (var dl = 0; dl < directLinks.length; dl++) {
        var dlink = directLinks[dl];
        var q = (dlink.quality || "").toUpperCase();
        
        if (q.indexOf("1080") !== -1 || q.indexOf("HD") !== -1 || q.indexOf("4K") !== -1) {
          hdLinks.push(dlink);
        } else if (q.indexOf("720") !== -1 || q.indexOf("480") !== -1) {
          sdLinks.push(dlink);
        } else {
          otherLinks.push(dlink);
        }
      }

      // Add HD links
      if (hdLinks.length > 0) {
        linkList.push({
          title: "HD Quality",
          links: hdLinks
        });
      }

      // Add SD links
      if (sdLinks.length > 0) {
        linkList.push({
          title: "SD Quality",
          links: sdLinks
        });
      }

      // Add other links
      if (otherLinks.length > 0) {
        linkList.push({
          title: "Stream Links",
          links: otherLinks
        });
      }

      // If no grouping worked, just add all
      if (linkList.length === 0) {
        linkList.push({
          title: "Available Streams",
          links: directLinks
        });
      }
    }

    console.log("Final linkList groups:", linkList.length);

    return {
      title: title,
      type: type,
      image: image,
      poster: image,
      background: image,
      synopsis: synopsis,
      year: year,
      rating: rating,
      duration: duration,
      director: director,
      cast: cast.join(", "),
      tags: genres,
      linkList: linkList
    };

  } catch (err) {
    console.error("getMetaData error:", err.message || err);
    return createEmptyMeta();
  }
}

function createEmptyMeta() {
  return {
    title: "",
    type: "movie",
    image: "",
    poster: "",
    background: "",
    synopsis: "",
    year: "",
    rating: "",
    tags: [],
    linkList: []
  };
}
