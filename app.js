/* ============================================================
   AgencyLister — Client-side search, filtering, load more
   Matches Webflow design structure
   ============================================================ */

(function () {
  'use strict';

  var itemsPerPage = (typeof ITEMS_PER_PAGE !== 'undefined') ? ITEMS_PER_PAGE : 24;

  // DOM refs
  var searchInput = document.getElementById('searchInput');
  var grid = document.getElementById('agencyGrid');
  var loadMoreWrap = document.getElementById('loadMoreWrap');
  var loadMoreBtn = document.getElementById('loadMoreBtn');
  var noResults = document.getElementById('noResults');
  var resultsCount = document.getElementById('resultsCount');
  var activeFiltersEl = document.getElementById('activeFilters');
  var sidebar = document.getElementById('sidebar');
  var menuIcon = document.getElementById('menuIcon');

  if (!grid) return;

  var allCards = Array.from(grid.querySelectorAll('.hero_content-item'));
  var visibleCount = 0;
  var totalVisible = 0;

  // State
  var filters = { category: '', country: '', industry: '', search: '' };

  // --- Category sidebar ---
  var categoryItems = document.querySelectorAll('.hero_aside-category-item');
  categoryItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-filter-value');
      filters.category = value;
      categoryItems.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      // Update hidden radio
      var radio = btn.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      // On mobile, collapse categories after selection
      if (categoryList && window.innerWidth <= 991) {
        categoryList.classList.add('collapsed');
      }

      applyFilters();
    });
  });

  // --- Dropdown filters ---
  var dropdowns = document.querySelectorAll('.hero_content-filter-dropdown');
  dropdowns.forEach(function (dd) {
    var toggle = dd.querySelector('.hero_content-filter-tab');
    var menu = dd.querySelector('.hero_content-filter-menu');
    var options = dd.querySelectorAll('.hero_content-filter-option');
    var clearX = toggle.querySelector('.clear-x');
    var labelEl = toggle.querySelector('.hero_content-filter-tab-label');

    // Toggle open/close
    toggle.addEventListener('click', function (e) {
      if (e.target === clearX || e.target.classList.contains('clear-x')) {
        // Clear this dropdown
        var type = options[0] ? options[0].getAttribute('data-filter-type') : '';
        if (type) filters[type] = '';
        toggle.classList.remove('is-selected');
        options.forEach(function (o) { o.classList.remove('active'); });
        dd.classList.remove('open');
        // Reset label
        if (type === 'country' && labelEl) labelEl.textContent = 'Country';
        if (type === 'industry' && labelEl) labelEl.textContent = 'Industry';
        applyFilters();
        return;
      }
      // Close other dropdowns
      dropdowns.forEach(function (other) {
        if (other !== dd) other.classList.remove('open');
      });
      dd.classList.toggle('open');
    });

    // Option select
    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        var type = opt.getAttribute('data-filter-type');
        var value = opt.getAttribute('data-filter-value');

        // Toggle: click same to deselect
        if (filters[type] === value) {
          filters[type] = '';
          opt.classList.remove('active');
          toggle.classList.remove('is-selected');
          if (type === 'country' && labelEl) labelEl.textContent = 'Country';
          if (type === 'industry' && labelEl) labelEl.textContent = 'Industry';
        } else {
          filters[type] = value;
          options.forEach(function (o) { o.classList.remove('active'); });
          opt.classList.add('active');
          toggle.classList.add('is-selected');
          if (labelEl) labelEl.textContent = value;
        }

        dd.classList.remove('open');
        applyFilters();
      });
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function (e) {
    dropdowns.forEach(function (dd) {
      if (!dd.contains(e.target)) dd.classList.remove('open');
    });
  });

  // --- Search ---
  var searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        filters.search = searchInput.value.trim().toLowerCase();
        applyFilters();
      }, 200);
    });
  }

  // --- Categories toggle (mobile) ---
  var categoriesToggle = document.getElementById('categoriesToggle');
  var categoryList = document.getElementById('categoryList');
  if (categoriesToggle && categoryList) {
    // Start collapsed on mobile
    if (window.innerWidth <= 991) {
      categoryList.classList.add('collapsed');
    }
    categoriesToggle.addEventListener('click', function () {
      categoryList.classList.toggle('collapsed');
    });
  }

  // --- Load more ---
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () { showMore(); });
  }

  // --- Core filter logic ---
  function applyFilters() {
    var matchingCards = [];

    allCards.forEach(function (card) {
      var show = true;

      if (filters.category) {
        if (card.getAttribute('data-category') !== filters.category) show = false;
      }
      if (filters.country) {
        if (card.getAttribute('data-country') !== filters.country) show = false;
      }
      if (filters.industry) {
        var industries = card.getAttribute('data-industries') || '';
        if (industries.indexOf(filters.industry) === -1) show = false;
      }
      if (filters.search) {
        var name = card.getAttribute('data-name') || '';
        var desc = '';
        var descEl = card.querySelector('.body-small.gray-600');
        if (descEl) desc = descEl.textContent || '';
        var haystack = (name + ' ' + desc).toLowerCase();
        if (haystack.indexOf(filters.search) === -1) show = false;
      }

      if (show) matchingCards.push(card);
      card.classList.add('hidden');
    });

    totalVisible = matchingCards.length;
    visibleCount = 0;

    matchingCards.forEach(function (card, i) {
      if (i < itemsPerPage) {
        card.classList.remove('hidden');
        visibleCount++;
      }
    });

    grid._matchingCards = matchingCards;
    updateUI();
    updateActiveFilters();
  }

  function showMore() {
    var matchingCards = grid._matchingCards || [];
    var nextBatch = matchingCards.slice(visibleCount, visibleCount + itemsPerPage);
    nextBatch.forEach(function (card) {
      card.classList.remove('hidden');
      visibleCount++;
    });
    updateUI();
  }

  function updateUI() {
    if (resultsCount) {
      resultsCount.textContent = totalVisible + ' agenc' + (totalVisible === 1 ? 'y' : 'ies');
    }

    if (loadMoreWrap) {
      loadMoreWrap.style.display = visibleCount < totalVisible ? 'block' : 'none';
    }

    if (loadMoreBtn) {
      var remaining = totalVisible - visibleCount;
      loadMoreBtn.textContent = remaining > 0 ? 'Load more (' + remaining + ' remaining)' : 'Load more';
    }

    if (noResults) {
      noResults.style.display = totalVisible === 0 ? 'block' : 'none';
    }
  }

  function updateActiveFilters() {
    if (!activeFiltersEl) return;
    activeFiltersEl.innerHTML = '';

    var active = [];
    if (filters.category) active.push({ type: 'category', value: filters.category });
    if (filters.country) active.push({ type: 'country', value: filters.country });
    if (filters.industry) active.push({ type: 'industry', value: filters.industry });
    if (filters.search) active.push({ type: 'search', value: '"' + filters.search + '"' });

    active.forEach(function (f) {
      var chip = document.createElement('button');
      chip.className = 'filter-chip';
      chip.innerHTML = f.value + ' <span class="filter-chip__x">&times;</span>';
      chip.addEventListener('click', function () {
        if (f.type === 'search') {
          filters.search = '';
          if (searchInput) searchInput.value = '';
        } else if (f.type === 'category') {
          filters.category = '';
          categoryItems.forEach(function (b) { b.classList.remove('active'); });
          // Re-activate "All Agencies"
          if (categoryItems[0]) categoryItems[0].classList.add('active');
        } else {
          filters[f.type] = '';
          // Reset the dropdown toggle
          var dd = document.getElementById(f.type + 'Dropdown');
          if (dd) {
            var toggle = dd.querySelector('.hero_content-filter-tab');
            var labelEl = toggle.querySelector('.hero_content-filter-tab-label');
            toggle.classList.remove('is-selected');
            if (labelEl) labelEl.textContent = f.type.charAt(0).toUpperCase() + f.type.slice(1);
            dd.querySelectorAll('.hero_content-filter-option').forEach(function (o) {
              o.classList.remove('active');
            });
          }
        }
        applyFilters();
      });
      activeFiltersEl.appendChild(chip);
    });
  }

  // --- Initial state: show first batch ---
  totalVisible = allCards.length;
  visibleCount = 0;
  grid._matchingCards = allCards;

  allCards.forEach(function (card, i) {
    if (i < itemsPerPage) {
      visibleCount++;
    } else {
      card.classList.add('hidden');
    }
  });

  updateUI();

  // Back to top button
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.style.display = window.scrollY > 800 ? 'block' : 'none';
    });
  }

})();
