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

    // Extract title from h1 or .sheader h1
    var title = "";
    var titleEl = $("h1.entry-title, .sheader h1, h1").first();
    if (titleEl.length > 0) {
      title = titleEl.text().trim();
    }
    // Clean up title
    title = title.replace(/Watch Online.*$/i, "").trim();
    title = title.replace(/Full Movie.*$/i, "").trim();
    console.log("Title found:", title ? title.substring(0, 40) : "none");

    // Determine content type
    var type = "movie";
    var lowerTitle = title.toLowerCase();
    if (lowerTitle.indexOf("season") !== -1 || lowerTitle.indexOf("episode") !== -1) {
      type = "series";
    }

    // Extract poster image
    var image = "";
    var posterImg = $(".poster img, .sheader img, .film-poster img, img.wp-post-image").first();
    if (posterImg.length > 0) {
      image = posterImg.attr("src") || posterImg.attr("data-src") || "";
    }
    // Fallback to any large image
    if (!image) {
      var contentImg = $("article img, .content img").first();
      if (contentImg.length > 0) {
        image = contentImg.attr("src") || "";
      }
    }
    console.log("Image found:", image ? image.substring(0, 50) : "none");

    // Extract synopsis/description
    var synopsis = "";
    var synopsisEl = $(".wp-content p, .description p, .contenido p, .story p").first();
    if (synopsisEl.length > 0) {
      synopsis = synopsisEl.text().trim();
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

    // PRMovies uses speedostream for streaming
    // Look for links in the download table
    var downloadLinks = $("table a[href], .dltable a[href], a[href*='speedostream']");
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
        
        // Try to extract quality from link text or parent row
        var quality = "";
        var qualityMatch = linkText.match(/(\d{3,4}p|HD|4K)/i);
        if (qualityMatch) {
          quality = qualityMatch[0].toUpperCase();
        }
        
        // Check parent row for quality info
        var parentRow = anchor.closest("tr");
        if (parentRow.length > 0) {
          var rowText = parentRow.text();
          var rowQualityMatch = rowText.match(/(\d{3,4}p|HD|4K)/i);
          if (rowQualityMatch && !quality) {
            quality = rowQualityMatch[0].toUpperCase();
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
