(function () {
  "use strict";

  var API_URL = window.FLORA_API;

  var grid = document.getElementById("bouquetGrid");
  if (!grid) return;

  var searchInput = document.getElementById("catalogueSearch");
  var categorySelect = document.getElementById("catalogueFilter");
  var controlsForm = document.getElementById("catalogueControls");
  var loadMoreBtn = document.getElementById("showMoreBtn");

  var loadingState = document.getElementById("catalogueLoading");
  var errorState = document.getElementById("catalogueError");
  var emptyState = document.getElementById("catalogueEmpty");
  var endState = document.getElementById("catalogueEnd");

  // Single source of truth for the catalogue's current state (Block 4).
  var state = {
    page: 1,
    limit: 6,
    category: "all",
    query: "",
    total: 0,
    renderedIds: new Set(),
  };

  var searchDebounceTimer = null;

  if (controlsForm) {
    controlsForm.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }

  function hideAllStates() {
    [loadingState, errorState, emptyState, endState].forEach(function (el) {
      if (el) el.classList.remove("is-visible");
    });
  }

  function showState(el) {
    hideAllStates();
    if (el) el.classList.add("is-visible");
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function cardTemplate(item) {
    var image1x = "images/" + item.image + "@1x.jpg";
    var image2x = "images/" + item.image + "@2x.jpg";
    var title = escapeHtml(item.title);

    return (
      '<li class="product-card" data-id="' +
      escapeHtml(item.id) +
      '">' +
      '<div class="product-card__media">' +
      '<img src="' +
      image1x +
      '" srcset="' +
      image1x +
      " 1x, " +
      image2x +
      ' 2x" width="340" height="296" alt="' +
      title +
      ' bouquet" loading="lazy" />' +
      "</div>" +
      '<div class="product-card__body">' +
      '<h3 class="product-card__title">' +
      title +
      "</h3>" +
      '<p class="product-card__text">' +
      escapeHtml(item.description) +
      "</p>" +
      '<div class="product-card__footer">' +
      '<span class="product-card__price">$' +
      escapeHtml(item.price) +
      "</span>" +
      '<div class="product-card__actions">' +
      '<button type="button" class="product-card__link js-view-btn" ' +
      'data-title="' + title + '" ' +
      'data-price="' + escapeHtml(item.price) + '" ' +
      'data-image1x="' + image1x + '" ' +
      'data-image2x="' + image2x + '" ' +
      'data-description="' + escapeHtml(item.description) + '">' +
      "Details" +
      "</button>" +
      '<button type="button" class="product-card__link js-order-btn" data-bouquet="' +
      title +
      '">' +
      "Order now" +
      '<svg class="icon" aria-hidden="true"><use href="images/icons.svg#icon-arrow-right" xlink:href="images/icons.svg#icon-arrow-right"></use></svg>' +
      "</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</li>"
    );
  }

  // Builds the whole batch of markup first, then inserts it in a single
  // insertAdjacentHTML call (no per-item appendChild loop).
  function renderItems(items) {
    var html = "";

    items.forEach(function (item) {
      if (state.renderedIds.has(item.id)) return; // guard against duplicates
      state.renderedIds.add(item.id);
      html += cardTemplate(item);
    });

    if (html) {
      grid.insertAdjacentHTML("beforeend", html);
    }
  }

  function resetGrid() {
    grid.innerHTML = "";
    state.renderedIds.clear();
  }

  function buildParams() {
    var params = {
      _page: state.page,
      _limit: state.limit,
    };

    if (state.category !== "all") {
      params.category = state.category;
    }

    if (state.query) {
      params.q = state.query;
    }

    return params;
  }

  async function fetchBouquets(isReplace) {
    hideAllStates();

    if (isReplace) {
      showState(loadingState);
    } else if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
    }

    try {
      var response = await axios.get(API_URL + "/bouquets", {
        params: buildParams(),
      });

      var items = Array.isArray(response.data) ? response.data : [];
      var totalHeader = response.headers
        ? response.headers["x-total-count"]
        : null;
      state.total = totalHeader ? parseInt(totalHeader, 10) : items.length;

      if (isReplace) {
        resetGrid();
      }

      renderItems(items);
      hideAllStates();
      updateFooterState(items.length);
    } catch (error) {
      showState(errorState);
      if (loadMoreBtn) loadMoreBtn.setAttribute("hidden", "");
    } finally {
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    }
  }

  function updateFooterState(lastBatchLength) {
    var shownCount = grid.children.length;

    if (shownCount === 0) {
      showState(emptyState);
      if (loadMoreBtn) loadMoreBtn.setAttribute("hidden", "");
      return;
    }

    var reachedEnd =
      lastBatchLength < state.limit || shownCount >= state.total;

    if (reachedEnd) {
      if (loadMoreBtn) loadMoreBtn.setAttribute("hidden", "");
      showState(endState);
    } else if (loadMoreBtn) {
      loadMoreBtn.removeAttribute("hidden");
    }
  }

  function applyFilters() {
    state.page = 1; // changing filters always resets pagination (Block 4)
    fetchBouquets(true);
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      window.clearTimeout(searchDebounceTimer);
      searchDebounceTimer = window.setTimeout(function () {
        state.query = searchInput.value.trim();
        applyFilters();
      }, 350);
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", function () {
      state.category = categorySelect.value;
      applyFilters();
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function () {
      state.page += 1;
      fetchBouquets(false);
    });
  }

  fetchBouquets(true);
})();
