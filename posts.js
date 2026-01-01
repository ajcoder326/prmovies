// PRMovies Posts Module - SYNCHRONOUS VERSION for Rhino JS

var BASE_URL = "https://prmovies.delivery";

var headers = {
  "Referer": "https://google.com",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
};

function getPosts(filter, page, providerContext) {
  console.log("getPosts called with filter:", filter, "page:", page);

  try {
    var url;
    if (filter === "" || filter === "/") {
      // Homepage - get featured content
      url = BASE_URL + "/";
      if (page > 1) {
        url = BASE_URL + "/page/" + page + "/";
      }
    } else {
      // Category/genre pages
      url = BASE_URL + filter + "/page/" + page + "/";
    }
    console.log("Fetching URL:", url);

    var response = axios.get(url, { headers: headers });
    console.log("Response received, data length:", response.data ? response.data.length : 0);

    if (!response.data) {
      console.error("No response data");
      return [];
    }

    var $ = cheerio.load(response.data);
    var posts = [];

    // PRMovies uses article.item or div.item with film-poster structure
    // Also check for items-list structure
    var items = $("article.item, div.item, .items article, .ml-item");
    console.log("Found items:", items.length);

    if (items.length === 0) {
      // Fallback: try finding by image and link patterns
      items = $("a[href*='Watch-online-full-movie']");
      console.log("Fallback link items:", items.length);
      
      for (var k = 0; k < items.length && k < 30; k++) {
        try {
          var anchor = items.eq(k);
          var href = anchor.attr("href") || "";
          var img = anchor.find("img").first();
          var titleText = anchor.text().trim();
          
          // Try to get title from various sources
          var title = img.attr("alt") || img.attr("title") || titleText || "";
          var image = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || "";
          
          // Clean up title - remove quality badges
          title = title.replace(/HINDI|720p|1080p|HD|CAM/gi, "").trim();
          
          if (title && href && image && title.length > 2) {
            // Avoid duplicate entries
            var isDuplicate = false;
            for (var d = 0; d < posts.length; d++) {
              if (posts[d].link === href) {
                isDuplicate = true;
                break;
              }
            }
            if (!isDuplicate) {
              posts.push({
                title: title,
                link: href,
                image: image
              });
            }
          }
        } catch (e) {
          console.error("Error parsing fallback item:", e);
        }
      }
      
      console.log("Found", posts.length, "posts from fallback");
      return posts;
    }

    for (var i = 0; i < items.length; i++) {
      try {
        var element = items.eq(i);
        var link = element.find("a").first();
        var img = element.find("img").first();
        var titleEl = element.find("h2, h3, .title, .entry-title").first();

        var title = titleEl.text() || img.attr("alt") || img.attr("title") || "";
        var href = link.attr("href") || "";
        var image = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || "";

        // Clean up title
        title = title.replace(/HINDI|720p|1080p|HD|CAM/gi, "").trim();

        if (title && href && image) {
          posts.push({
            title: title,
            link: href,
            image: image
          });
        }
      } catch (e) {
        console.error("Error parsing item:", e);
      }
    }

    console.log("Found", posts.length, "posts");
    return posts;
  } catch (err) {
    console.error("getPosts error:", err.message || err);
    return [];
  }
}

function getSearchPosts(query, page, providerContext) {
  console.log("getSearchPosts called with query:", query, "page:", page);

  try {
    // PRMovies search URL format
    var url = BASE_URL + "/page/" + page + "/?s=" + encodeURIComponent(query);
    console.log("Search URL:", url);

    var response = axios.get(url, { headers: headers });
    console.log("Search response received, data length:", response.data ? response.data.length : 0);

    if (!response.data) {
      console.error("No search response data");
      return [];
    }

    var $ = cheerio.load(response.data);
    var posts = [];

    // Search results structure
    var items = $("article.item, div.item, .result-item, .search-item");
    console.log("Found search items:", items.length);

    if (items.length === 0) {
      // Fallback: find by link pattern
      items = $("a[href*='Watch-online-full-movie']");
      console.log("Fallback search items:", items.length);
      
      for (var k = 0; k < items.length && k < 30; k++) {
        try {
          var anchor = items.eq(k);
          var href = anchor.attr("href") || "";
          var img = anchor.find("img").first();
          var titleText = anchor.text().trim();
          
          var title = img.attr("alt") || img.attr("title") || titleText || "";
          var image = img.attr("src") || img.attr("data-src") || "";
          
          title = title.replace(/HINDI|720p|1080p|HD|CAM/gi, "").trim();
          
          if (title && href && image && title.length > 2) {
            var isDuplicate = false;
            for (var d = 0; d < posts.length; d++) {
              if (posts[d].link === href) {
                isDuplicate = true;
                break;
              }
            }
            if (!isDuplicate) {
              posts.push({
                title: title,
                link: href,
                image: image
              });
            }
          }
        } catch (e) {
          console.error("Error parsing fallback search item:", e);
        }
      }
      
      console.log("Found", posts.length, "search results from fallback");
      return posts;
    }

    for (var i = 0; i < items.length; i++) {
      try {
        var element = items.eq(i);
        var img = element.find("img").first();
        var link = element.find("a").first();
        var titleEl = element.find("h2, h3, .title, .entry-title").first();

        var title = titleEl.text() || img.attr("alt") || img.attr("title") || "";
        var href = link.attr("href") || "";
        var image = img.attr("src") || img.attr("data-src") || "";

        title = title.replace(/HINDI|720p|1080p|HD|CAM/gi, "").trim();

        if (title && href && image) {
          posts.push({
            title: title,
            link: href,
            image: image
          });
        }
      } catch (e) {
        console.error("Error parsing search item:", e);
      }
    }

    console.log("Found", posts.length, "search results");
    return posts;
  } catch (err) {
    console.error("getSearchPosts error:", err.message || err);
    return [];
  }
}
